import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, "..");
const workspaceRoot = resolve(packageDir, "..", "..");
const distDir = resolve(packageDir, "dist");

// ── Build workspace dependencies that get vendored ──
const coreDir = resolve(workspaceRoot, "packages", "core");
const regDir = resolve(workspaceRoot, "packages", "registry-metadata");

// Only build if dist is missing — re-packing here races with concurrent
// workspace builds (e.g. apps/editor) that resolve these packages' entries.
for (const dir of [coreDir, regDir]) {
  if (existsSync(join(dir, "dist", "index.mjs"))) continue;
  execSync("vp pack", { cwd: dir, stdio: "inherit" });
}

// ── Copy editor app ──
const editorSourceDir = resolve(workspaceRoot, "apps", "editor");
if (!existsSync(editorSourceDir)) {
  throw new Error(`Editor source directory not found: ${editorSourceDir}`);
}

const editorTargetDir = resolve(distDir, "editor");
rmSync(editorTargetDir, { recursive: true, force: true });
mkdirSync(editorTargetDir, { recursive: true });

cpSync(editorSourceDir, editorTargetDir, {
  recursive: true,
  filter(source) {
    return !source.includes(`${editorSourceDir}/node_modules`);
  },
});

// ── Copy @plannar/core dist + CSS ──
const coreDistDir = join(coreDir, "dist");
if (existsSync(coreDistDir)) {
  const coreTargetDir = resolve(distDir, "core");
  rmSync(coreTargetDir, { recursive: true, force: true });
  cpSync(coreDistDir, coreTargetDir, { recursive: true });
}

const coreStylesDir = join(coreDir, "src", "styles");
const coreStylesTarget = resolve(distDir, "core-styles");
if (existsSync(coreStylesDir)) {
  rmSync(coreStylesTarget, { recursive: true, force: true });
  mkdirSync(coreStylesTarget, { recursive: true });
  cpSync(join(coreStylesDir, "mdx.css"), join(coreStylesTarget, "mdx.css"));
  cpSync(join(coreStylesDir, "theme.css"), join(coreStylesTarget, "theme.css"));
}

// ── Copy @plannar/registry-metadata dist ──
const regDistDir = join(regDir, "dist");
if (existsSync(regDistDir)) {
  const regTargetDir = resolve(distDir, "registry-metadata");
  rmSync(regTargetDir, { recursive: true, force: true });
  cpSync(regDistDir, regTargetDir, { recursive: true });
}

// ── Fix editor package.json: remove @plannar/core dep ──
const editorPkgPath = resolve(editorTargetDir, "package.json");
if (existsSync(editorPkgPath)) {
  const pkg = JSON.parse(readFileSync(editorPkgPath, "utf-8"));
  delete pkg.dependencies["@plannar/core"];
  writeFileSync(editorPkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

// ── Fix editor source files: replace @plannar/core imports with relative paths ──

const viteSharedPath = resolve(editorTargetDir, "vite.shared.ts");
if (existsSync(viteSharedPath)) {
  let content = readFileSync(viteSharedPath, "utf-8");
  content = content.replace(/from\s+["']@plannar\/core["']/g, 'from "../core/index.mjs"');
  content = content.replace(
    /import\s+type\s+\{\s*BindingMeta\s*\}\s+from\s+["']@plannar\/core["']/g,
    'import type { BindingMeta } from "../core/index.mjs"',
  );
  writeFileSync(viteSharedPath, content);
}

const viteSharedDtsPath = resolve(editorTargetDir, "vite.shared.d.ts");
if (existsSync(viteSharedDtsPath)) {
  let content = readFileSync(viteSharedDtsPath, "utf-8");
  content = content.replace(/["']@plannar\/core["']/g, '"../core/index.mjs"');
  writeFileSync(viteSharedDtsPath, content);
}

const editorMainPath = resolve(editorTargetDir, "src", "main.tsx");
if (existsSync(editorMainPath)) {
  let content = readFileSync(editorMainPath, "utf-8");
  content = content.replace(
    /["']@plannar\/core\/styles\/mdx\.css["']/g,
    '"../../core-styles/mdx.css"',
  );
  writeFileSync(editorMainPath, content);
}

const editorCssPath = resolve(editorTargetDir, "src", "index.css");
if (existsSync(editorCssPath)) {
  let content = readFileSync(editorCssPath, "utf-8");
  content = content.replace(
    /["']@plannar\/core\/styles\/theme\.css["']/g,
    '"../../core-styles/theme.css"',
  );
  writeFileSync(editorCssPath, content);
}
