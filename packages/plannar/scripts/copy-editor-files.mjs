import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, "..");
const workspaceRoot = resolve(packageDir, "..", "..");
const sourceDir = resolve(workspaceRoot, "apps", "editor");
const targetDir = resolve(packageDir, "dist", "editor");

if (!existsSync(sourceDir)) {
  throw new Error(`Editor source directory not found: ${sourceDir}`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

cpSync(sourceDir, targetDir, {
  recursive: true,
  filter(source) {
    return !source.includes(`${sourceDir}/node_modules`);
  },
});
