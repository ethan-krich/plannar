import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin } from "@plannar/core";

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
});
