import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/cli.ts"],
    format: ["esm"],
    deps: {
      neverBundle: ["vite", "@tailwindcss/vite", "@vitejs/plugin-react"],
      alwaysBundle: ["@plannar/export", "@plannar/core", "@plannar/registry-metadata"],
    },
    dts: {
      tsgo: true,
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
