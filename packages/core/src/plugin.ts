import { generateMdx } from "./generate-mdx.js";
import type { BindingMeta } from "./plugins/meta.js";

export function mdxPlugin(options?: { bindings?: Record<string, BindingMeta> }) {
  return {
    name: "mdx",
    async transform(code: string, id: string) {
      if (id.endsWith(".mdx")) {
        const compiled = await generateMdx(id, { content: code, ...options });
        return {
          code: compiled,
          map: null,
        };
      }
    },
  };
}
