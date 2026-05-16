import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { generateMdx } from "@plannar/core";

const mdxPlugin = {
  name: "mdx",
  async transform(_code: string, id: string) {
    if (id.endsWith(".mdx")) {
      const compiled = await generateMdx(id);
      return {
        code: compiled,
        map: null,
      };
    }
  },
};

export default defineConfig({
  root: "apps/editor",
  plugins: [tailwindcss(), react(), mdxPlugin],
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    cache: true,
  },
} as any);
