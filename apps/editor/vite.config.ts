import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { generateMdx } from "@plannar/core";

export default defineConfig({
  plugins: [
    react(),
    {
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
    },
  ],
});
