import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Parser } from "acorn";
import acornJsx from "acorn-jsx";
//#region src/plugins/meta.ts
/**
 * Built-in HTML element bindings.
 * Keys are element name, or `element:type` for inputs with a type attribute.
 */
const htmlBindings = {
  input: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  "input:checkbox": {
    valueProp: "checked",
    changeProp: "onChange",
    extract: "e.target.checked",
  },
  "input:number": {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.valueAsNumber",
  },
  textarea: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  select: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
};
//#endregion
//#region src/plugins/remark-state-bind.ts
const _parser = Parser.extend(acornJsx());
function parseEsm(code) {
  return _parser.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
  });
}
const remarkStateBind = (options) => {
  const bindings = {
    ...htmlBindings,
    ...options?.bindings,
  };
  const state = {
    counter: 0,
    importAdded: false,
  };
  return (tree) => {
    state.counter = 0;
    state.importAdded = false;
    visitAndTransform(tree, tree, state, bindings);
    if (state.importAdded)
      tree.children.unshift({
        type: "mdxjsEsm",
        value: `import { useState } from "react"`,
        data: { estree: parseEsm(`import { useState } from "react"`) },
      });
  };
};
function visitAndTransform(node, root, state, bindings) {
  if (!node.children) return;
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    if (child.children) visitAndTransform(child, root, state, bindings);
  }
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === "mdxJsxFlowElement" && child.name === "Playground") {
      const transformed = transformPlayground(child, node.children, i, root, state, bindings);
      i += transformed.indexOffset;
    }
  }
}
function transformPlayground(playground, siblings, index, root, state, bindings) {
  const binds = collectBinds(playground, playground);
  const names = binds.map((b) => b.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0)
    throw new Error(`Duplicate bind names in <Playground>: ${[...new Set(dupes)].join(", ")}`);
  applyBindings(playground, binds, bindings);
  const componentName = `_PlannarPlayground_${state.counter++}`;
  const childrenJsx = (playground.children || []).map(serializeNode).join("\n");
  const stateDecls = binds
    .map((b) => `const [${b.name}, set${capitalize(b.name)}] = useState(${b.initialValue})`)
    .join("\n  ");
  const esmCode = `function ${componentName}() {\n  ${stateDecls ? stateDecls + "\n  " : ""}return (<>\n${indent(childrenJsx)}\n</>)\n}`;
  if (stateDecls && !state.importAdded) state.importAdded = true;
  const esmNode = {
    type: "mdxjsEsm",
    value: esmCode,
    data: { estree: parseEsm(esmCode) },
  };
  siblings[index] = {
    type: "mdxJsxFlowElement",
    name: componentName,
    attributes: [],
    children: [],
  };
  root.children.unshift(esmNode);
  return { indexOffset: 0 };
}
function collectBinds(node, owningPlayground) {
  const binds = [];
  if (node !== owningPlayground && node.type === "mdxJsxFlowElement" && node.name === "Playground")
    return binds;
  if (Array.isArray(node.attributes)) {
    for (const attr of node.attributes)
      if (attr.type === "mdxJsxAttribute" && attr.name === "bind") {
        const attrValue = attr.value;
        if (
          typeof attrValue === "object" &&
          attrValue !== null &&
          attrValue.type === "mdxJsxAttributeValueExpression"
        ) {
          const expr = String(attrValue.value ?? "");
          const colonIdx = expr.indexOf(":");
          if (colonIdx === -1)
            binds.push({
              name: expr,
              initialValue: "undefined",
            });
          else {
            const name = expr.slice(0, colonIdx);
            const initial = expr.slice(colonIdx + 1) || "undefined";
            binds.push({
              name,
              initialValue: initial,
            });
          }
        } else {
          const raw = String(attrValue ?? "");
          const colonIdx = raw.indexOf(":");
          if (colonIdx === -1)
            binds.push({
              name: raw,
              initialValue: "undefined",
            });
          else {
            const name = raw.slice(0, colonIdx);
            const initial = raw.slice(colonIdx + 1) || "undefined";
            binds.push({
              name,
              initialValue: initial,
            });
          }
        }
      }
  }
  if (Array.isArray(node.children))
    for (const child of node.children) binds.push(...collectBinds(child, owningPlayground));
  return binds;
}
function applyBindings(node, binds, bindings) {
  const bindNameSet = new Set(binds.map((b) => b.name));
  if (Array.isArray(node.attributes)) {
    const attrs = node.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attr = attrs[i];
      if (attr.type === "mdxJsxAttribute" && attr.name === "bind") {
        const parsed = parseBindValue(attr);
        if (parsed && bindNameSet.has(parsed.name)) {
          const elName = String(node.name || "").toLowerCase();
          const typeAttr = attrs.find((a) => a.type === "mdxJsxAttribute" && a.name === "type");
          const replacement = bindingAttrs(
            elName,
            typeAttr ? String(typeAttr.value ?? "text") : "",
            parsed.name,
            bindings,
          );
          attrs.splice(i, 1, ...replacement);
        } else attrs.splice(i, 1);
      }
    }
  }
  if (Array.isArray(node.children))
    for (const child of node.children) applyBindings(child, binds, bindings);
}
function parseBindValue(attr) {
  const raw = parseAttrValue(attr);
  if (!raw) return null;
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1)
    return {
      name: raw,
      initialValue: "undefined",
    };
  return {
    name: raw.slice(0, colonIdx),
    initialValue: raw.slice(colonIdx + 1) || "undefined",
  };
}
function parseAttrValue(attr) {
  const v = attr.value;
  if (typeof v === "object" && v !== null && v.type === "mdxJsxAttributeValueExpression")
    return String(v.value ?? "");
  if (typeof v === "string") return v;
  if (v == null) return "";
  return null;
}
function bindingAttrs(elName, inputType, name, bindings) {
  const meta = bindings[inputType ? `${elName}:${inputType}` : elName] ?? bindings[elName];
  if (!meta) return [];
  const setter = `set${capitalize(name)}`;
  const valueExpr = meta.inject ? meta.inject.replace(/\bv\b/g, name) : name;
  return [
    exprAttr(meta.valueProp, valueExpr),
    exprAttr(meta.changeProp, `(e) => ${setter}(${meta.extract})`),
  ];
}
function exprAttr(name, expr) {
  return {
    type: "mdxJsxAttribute",
    name,
    value: {
      type: "mdxJsxAttributeValueExpression",
      value: expr,
      data: {
        estree: _parser.parse(expr, {
          ecmaVersion: "latest",
          sourceType: "module",
          locations: true,
        }),
      },
    },
  };
}
function serializeNode(node) {
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
      if (Array.isArray(node.children)) return node.children.map(serializeNode).join("");
      return "";
  }
}
function serializeJsxElement(node) {
  const attrs = (node.attributes || []).map(serializeAttribute).filter(Boolean).join(" ");
  const openTag = `<${node.name}${attrs ? " " + attrs : ""}>`;
  const body = (node.children || []).map(serializeNode).join("");
  const closeTag = `</${node.name}>`;
  return openTag + body + closeTag;
}
function serializeAttribute(attr) {
  if (attr.type === "mdxJsxExpressionAttribute") return `{...${attr.value}}`;
  if (attr.type === "mdxJsxAttribute") {
    if (
      typeof attr.value === "object" &&
      attr.value !== null &&
      attr.value.type === "mdxJsxAttributeValueExpression"
    )
      return `${attr.name}={${attr.value.value}}`;
    const strVal = attr.value == null ? "" : String(attr.value);
    return `${attr.name}=${JSON.stringify(strVal)}`;
  }
  return "";
}
function escapeJsxText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function indent(text) {
  return text
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
}
//#endregion
//#region src/generate-mdx.ts
async function generateMdx(filepath, options = {}) {
  const { content, bindings, ...mdxOptions } = options;
  const absolutePath = resolve(filepath);
  const result = await compile(
    {
      value: content ?? (await readFile(absolutePath, "utf-8")),
      path: absolutePath,
    },
    {
      development: false,
      ...mdxOptions,
      remarkPlugins: [
        [remarkStateBind, { bindings }],
        remarkGfm,
        ...(mdxOptions.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        rehypePrettyCode,
        rehypeAutolinkHeadings,
        ...(mdxOptions.rehypePlugins ?? []),
      ],
    },
  );
  return String(result.value);
}
//#endregion
//#region src/plugin.ts
function mdxPlugin(options) {
  return {
    name: "mdx",
    async transform(code, id) {
      if (id.endsWith(".mdx"))
        return {
          code: await generateMdx(id, {
            content: code,
            ...options,
          }),
          map: null,
        };
    },
  };
}
//#endregion
export { generateMdx, mdxPlugin, remarkStateBind };
