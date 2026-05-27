import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, "..");
const workspaceRoot = resolve(packageDir, "..", "..");
const coreStylesDir = resolve(workspaceRoot, "packages", "core", "src", "styles");
const targetDir = resolve(packageDir, "dist", "core-styles");

if (!existsSync(coreStylesDir)) {
  throw new Error(`Core styles directory not found: ${coreStylesDir}`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(join(coreStylesDir, "mdx.css"), join(targetDir, "mdx.css"));
cpSync(join(coreStylesDir, "theme.css"), join(targetDir, "theme.css"));
