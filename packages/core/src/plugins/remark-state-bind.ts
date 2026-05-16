import { Parser } from "acorn";
import acornJsx from "acorn-jsx";
import { htmlBindings } from "./meta.js";

interface AstNode {
  type: string;
  children?: AstNode[];
  data?: any;
  [key: string]: any;
}

interface BindEntry {
  name: string;
  initialValue: string;
}

const _parser = Parser.extend(acornJsx());

function parseEsm(code: string): any {
  return _parser.parse(code, {
    ecmaVersion: "latest" as any,
    sourceType: "module",
    locations: true,
  });
}

let playgroundCounter = 0;
let useStateImportAdded = false;

export const remarkStateBind = () => {
  return (tree: AstNode) => {
    playgroundCounter = 0;
    useStateImportAdded = false;
    visitAndTransform(tree, tree);

    if (useStateImportAdded) {
      tree.children!.unshift({
        type: "mdxjsEsm",
        value: `import { useState } from "react"`,
        data: { estree: parseEsm(`import { useState } from "react"`) },
      });
    }
  };
};

function visitAndTransform(node: AstNode, root: AstNode): void {
  if (!node.children) return;

  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    if (child.children) {
      visitAndTransform(child, root);
    }
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === "mdxJsxFlowElement" && child.name === "Playground") {
      const transformed = transformPlayground(child as AstNode, node.children, i, root);
      i += transformed.indexOffset;
    }
  }
}

function transformPlayground(
  playground: AstNode,
  siblings: AstNode[],
  index: number,
  root: AstNode,
): { indexOffset: number } {
  const binds = collectBinds(playground, playground);

  const names = binds.map((b) => b.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate bind names in <Playground>: ${[...new Set(dupes)].join(", ")}`);
  }

  applyBindings(playground, binds);

  const counter = playgroundCounter++;
  const componentName = `_PlannarPlayground_${counter}`;

  const childrenJsx = (playground.children || []).map(serializeNode).join("\n");

  const stateDecls = binds
    .map((b) => `const [${b.name}, set${capitalize(b.name)}] = useState(${b.initialValue})`)
    .join("\n  ");

  const esmCode = `function ${componentName}() {\n  ${stateDecls ? stateDecls + "\n  " : ""}return (<>\n${indent(childrenJsx)}\n</>)\n}`;

  if (stateDecls && !useStateImportAdded) {
    useStateImportAdded = true;
  }

  const estree = parseEsm(esmCode);

  const esmNode: AstNode = {
    type: "mdxjsEsm",
    value: esmCode,
    data: { estree },
  };

  const replacement: AstNode = {
    type: "mdxJsxFlowElement",
    name: componentName,
    attributes: [],
    children: [],
  };

  siblings[index] = replacement;

  root.children!.unshift(esmNode);

  return { indexOffset: 0 };
}

function collectBinds(node: AstNode, owningPlayground: AstNode): BindEntry[] {
  const binds: BindEntry[] = [];

  if (
    node !== owningPlayground &&
    node.type === "mdxJsxFlowElement" &&
    node.name === "Playground"
  ) {
    return binds;
  }

  if (Array.isArray(node.attributes)) {
    for (const attr of node.attributes as AstNode[]) {
      if (attr.type === "mdxJsxAttribute" && attr.name === "bind") {
        const attrValue = attr.value;
        if (
          typeof attrValue === "object" &&
          attrValue !== null &&
          (attrValue as AstNode).type === "mdxJsxAttributeValueExpression"
        ) {
          const expr = String((attrValue as AstNode).value ?? "");
          const colonIdx = expr.indexOf(":");
          if (colonIdx === -1) {
            binds.push({ name: expr, initialValue: "undefined" });
          } else {
            const name = expr.slice(0, colonIdx);
            const initial = expr.slice(colonIdx + 1) || "undefined";
            binds.push({ name, initialValue: initial });
          }
        } else {
          const raw = String(attrValue ?? "");
          const colonIdx = raw.indexOf(":");
          if (colonIdx === -1) {
            binds.push({ name: raw, initialValue: "undefined" });
          } else {
            const name = raw.slice(0, colonIdx);
            const initial = raw.slice(colonIdx + 1) || "undefined";
            binds.push({ name, initialValue: initial });
          }
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      binds.push(...collectBinds(child, owningPlayground));
    }
  }

  return binds;
}

function applyBindings(node: AstNode, binds: BindEntry[]): void {
  const bindNameSet = new Set(binds.map((b) => b.name));

  if (Array.isArray(node.attributes)) {
    const attrs = node.attributes as AstNode[];
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attr = attrs[i];
      if (attr.type === "mdxJsxAttribute" && attr.name === "bind") {
        const parsed = parseBindValue(attr);
        if (parsed && bindNameSet.has(parsed.name)) {
          const elName = String(node.name || "").toLowerCase();
          const typeAttr = attrs.find(
            (a: AstNode) => a.type === "mdxJsxAttribute" && a.name === "type",
          );
          const inputType = typeAttr ? String(typeAttr.value ?? "text") : "";
          const replacement = bindingAttrs(elName, inputType, parsed.name);
          attrs.splice(i, 1, ...replacement);
        } else {
          attrs.splice(i, 1);
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      applyBindings(child, binds);
    }
  }
}

function parseBindValue(attr: AstNode): { name: string; initialValue: string } | null {
  const raw = parseAttrValue(attr);
  if (!raw) return null;
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) {
    return { name: raw, initialValue: "undefined" };
  }
  return {
    name: raw.slice(0, colonIdx),
    initialValue: raw.slice(colonIdx + 1) || "undefined",
  };
}

function parseAttrValue(attr: AstNode): string | null {
  const v = attr.value;
  if (
    typeof v === "object" &&
    v !== null &&
    (v as AstNode).type === "mdxJsxAttributeValueExpression"
  ) {
    return String((v as AstNode).value ?? "");
  }
  if (typeof v === "string") return v;
  if (v == null) return "";
  return null;
}

function bindingAttrs(elName: string, inputType: string, name: string): AstNode[] {
  const key = inputType ? `${elName}:${inputType}` : elName;
  const meta = htmlBindings[key] ?? htmlBindings[elName];
  if (!meta) return [];

  const setter = `set${capitalize(name)}`;
  const valueExpr = meta.inject ? meta.inject.replace(/\bv\b/g, name) : name;

  return [
    exprAttr(meta.valueProp, valueExpr),
    exprAttr(meta.changeProp, `(e) => ${setter}(${meta.extract})`),
  ];
}

function exprAttr(name: string, expr: string): AstNode {
  const estree = _parser.parse(expr, {
    ecmaVersion: "latest" as any,
    sourceType: "module",
    locations: true,
  });
  return {
    type: "mdxJsxAttribute",
    name,
    value: {
      type: "mdxJsxAttributeValueExpression",
      value: expr,
      data: { estree },
    },
  };
}

function serializeNode(node: AstNode): string {
  switch (node.type) {
    case "text":
      return escapeJsxText(String(node.value ?? ""));
    case "inlineCode":
      return `<code>${escapeJsxText(String(node.value ?? ""))}</code>`;
    case "strong":
      return `<strong>${(node.children || []).map(serializeNode).join("")}</strong>`;
    case "emphasis":
      return `<em>${(node.children || []).map(serializeNode).join("")}</em>`;
    case "delete":
      return `<del>${(node.children || []).map(serializeNode).join("")}</del>`;
    case "link":
      return `<a href="${node.url}">${(node.children || []).map(serializeNode).join("")}</a>`;
    case "image":
      return `<img src="${node.url}" alt="${node.alt || ""}" />`;
    case "break":
      return "<br />";
    case "thematicBreak":
      return "<hr />";
    case "mdxTextExpression":
    case "mdxFlowExpression":
      return `{${node.value}}`;
    case "mdxJsxTextElement":
    case "mdxJsxFlowElement":
      return serializeJsxElement(node);
    case "paragraph":
      return `<p>${(node.children || []).map(serializeNode).join("")}</p>`;
    case "heading":
      return `<h${node.depth}>${(node.children || []).map(serializeNode).join("")}</h${node.depth}>`;
    case "blockquote":
      return `<blockquote>${(node.children || []).map(serializeNode).join("")}</blockquote>`;
    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}>${(node.children || []).map(serializeNode).join("")}</${tag}>`;
    }
    case "listItem":
      return `<li>${(node.children || []).map(serializeNode).join("")}</li>`;
    case "code":
      return `<pre><code>${escapeJsxText(String(node.value ?? ""))}</code></pre>`;
    default:
      if (Array.isArray(node.children)) {
        return node.children.map(serializeNode).join("");
      }
      return "";
  }
}

function serializeJsxElement(node: AstNode): string {
  const attrs = ((node.attributes as AstNode[]) || [])
    .map(serializeAttribute)
    .filter(Boolean)
    .join(" ");
  const openTag = `<${node.name}${attrs ? " " + attrs : ""}>`;
  const body = (node.children || []).map(serializeNode).join("");
  const closeTag = `</${node.name}>`;
  return openTag + body + closeTag;
}

function serializeAttribute(attr: AstNode): string {
  if (attr.type === "mdxJsxExpressionAttribute") {
    return `{...${attr.value}}`;
  }
  if (attr.type === "mdxJsxAttribute") {
    if (
      typeof attr.value === "object" &&
      attr.value !== null &&
      (attr.value as AstNode).type === "mdxJsxAttributeValueExpression"
    ) {
      return `${attr.name}={${(attr.value as AstNode).value}}`;
    }
    const strVal = attr.value == null ? "" : String(attr.value);
    return `${attr.name}=${JSON.stringify(strVal)}`;
  }
  return "";
}

function escapeJsxText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
}
