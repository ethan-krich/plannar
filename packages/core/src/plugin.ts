import { readFileSync } from "node:fs";
import { generateMdx } from "./generate-mdx.js";
import type { BindingMeta } from "./plugins/meta.js";

function hoistImports(code: string): string {
  const imports: string[] = [];
  const rest: string[] = [];
  for (const line of code.split("\n")) {
    if (line.startsWith("import ")) {
      imports.push(line);
    } else {
      rest.push(line);
    }
  }
  return [...imports, ...rest].join("\n");
}

export function mdxPlugin(options?: {
  bindings?: Record<string, BindingMeta>;
  development?: boolean;
}) {
  return {
    name: "mdx",
    async load(id: string) {
      if (id.endsWith(".mdx")) {
        const raw = readFileSync(id, "utf-8");
        const compiled = await generateMdx(id, {
          content: raw,
          ...options,
        });
        return hoistImports(compiled);
      }
    },
  };
}
