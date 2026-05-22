import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createEditorViteConfig } from "./vite.shared.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = process.env.PLANNAR_CWD ?? resolve(__dirname, "../..");

export default defineConfig(
  createEditorViteConfig({
    appDir: __dirname,
    workspaceRoot,
  }),
);
