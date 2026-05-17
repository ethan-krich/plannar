import { generateMdx } from "./generate-mdx.js";

export const mdxPlugin = {
  name: "mdx",
  async transform(code: string, id: string) {
    if (id.endsWith(".mdx")) {
      const compiled = await generateMdx(id, { content: code });
      return {
        code: compiled,
        map: null,
      };
    }
  },
};
