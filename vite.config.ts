import { defineConfig } from "vite-plus";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createEditorViteConfig } from "./apps/editor/vite.shared.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  ...createEditorViteConfig({
    appDir: resolve(__dirname, "apps/editor"),
    workspaceRoot: process.env.PLANNAR_CWD ?? process.cwd(),
  }),
  root: "apps/editor",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    cache: true,
  },
});
