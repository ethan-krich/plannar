import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { generateMdx } from "@plannar/core";
import { shadcnBindings } from "@plannar/registry-metadata";

const pkgDir = dirname(fileURLToPath(import.meta.url));

export type ExportOptions = {
  cwd?: string;
  plannarFolder?: string;
  exportsFolder?: string;
  globalCss?: string;
  cssFilePath?: string;
  viteConfig?: Record<string, unknown>;
};

export async function exportPlan(planName: string, options: ExportOptions = {}): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const plannarFolder = options.plannarFolder ?? ".plannar";
  const exportsFolder = options.exportsFolder ?? `${plannarFolder}/exports`;

  const planPath = join(cwd, plannarFolder, "plans", `${planName}.mdx`);

  const compiled = await generateMdx(planPath, {
    bindings: shadcnBindings,
  });

  const tmpDir = mkdtempSync(join(tmpdir(), "plannar-export-"));
  try {
    const html = await buildExportHtml(compiled, tmpDir, cwd, plannarFolder, options);

    const outDir = resolve(cwd, exportsFolder);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${planName}.html`);
    writeFileSync(outPath, html, "utf-8");

    return outPath;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = (result as Record<string, unknown>)[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = sv;
    }
  }
  return result;
}

function resolveExistingCssImport(cwd: string, tmpDir: string, cssPath?: string): string | null {
  if (!cssPath) {
    return null;
  }

  const cssAbs = resolve(cwd, cssPath);
  if (!existsSync(cssAbs)) {
    return null;
  }

  return relative(tmpDir, cssAbs).replaceAll("\\", "/");
}

function injectBrowserProcessShim(html: string): string {
  const bareProcessEnv = /(?<!window\.)process\.env\b/;
  if (!bareProcessEnv.test(html)) {
    return html;
  }

  const shim = `<script>window.process ??= {}; window.process.env ??= {}; window.process.env.NODE_ENV ??= "production";</script>`;
  return html.includes("</head>") ? html.replace("</head>", `${shim}</head>`) : `${shim}${html}`;
}

async function buildExportHtml(
  compiled: string,
  tmpDir: string,
  cwd: string,
  plannarFolder: string,
  options: ExportOptions,
): Promise<string> {
  const plannarDir = join(cwd, plannarFolder);
  const sourcePath = relative(tmpDir, plannarDir).replaceAll("\\", "/");

  const nodeModulesSource =
    findNearestNodeModules(pkgDir) ??
    findNearestNodeModules(cwd) ??
    findNearestNodeModules(plannarDir) ??
    findNearestNodeModules(tmpDir);

  if (nodeModulesSource) {
    symlinkSync(nodeModulesSource, join(tmpDir, "node_modules"), "dir");
  }

  const planModule = compiled
    .replace(/export\s+default\s+function\s+MDXContent/g, "function Plan")
    .replace(/export\s+{\s*MDXContent\s+as\s+default\s*}/g, "");

  writeFileSync(join(tmpDir, "plan-content.tsx"), `${planModule}\nexport { Plan };\n`, "utf-8");

  writeFileSync(
    join(tmpDir, "plan.tsx"),
    `import { Plan } from "./plan-content";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <div className="mdx-content">
      <Plan />
    </div>
  );
}`,
    "utf-8",
  );

  let cssImports = "";
  const globalCssRel = resolveExistingCssImport(cwd, tmpDir, options.globalCss);
  if (globalCssRel) {
    cssImports += `@import "${globalCssRel}";\n`;
  }
  const cssFilePathRel = resolveExistingCssImport(cwd, tmpDir, options.cssFilePath);
  if (cssFilePathRel) {
    cssImports += `@import "${cssFilePathRel}";\n`;
  }

  writeFileSync(
    join(tmpDir, "index.css"),
    `@import "tailwindcss";
@import "tw-animate-css";
@import "@plannar/core/styles/mdx.css";
@import "@plannar/core/styles/theme.css";
${cssImports}@source "${sourcePath}";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`,
    "utf-8",
  );

  const outDir = join(tmpDir, "dist");

  const baseBuildConfig = {
    root: tmpDir,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    build: {
      outDir,
      minify: false,
      cssCodeSplit: false,
      lib: {
        entry: join(tmpDir, "plan.tsx"),
        name: "PlannarExport",
        formats: ["es"] as const,
        fileName: () => "plan.js",
        cssFileName: "plan",
      },
    },
    plugins: [tailwindcss(), react(), inlineAssetsPlugin(outDir)],
    resolve: { alias: { "@": plannarDir } },
    logLevel: "warn" as const,
  };

  const buildConfig = options.viteConfig
    ? deepMerge(baseBuildConfig as unknown as Record<string, unknown>, options.viteConfig)
    : baseBuildConfig;

  await build(buildConfig as Parameters<typeof build>[0]);

  return injectBrowserProcessShim(readFileSync(join(outDir, "index.html"), "utf-8"));
}

function findNearestNodeModules(startDir: string): string | null {
  let dir = resolve(startDir);

  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "node_modules");
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

function inlineAssetsPlugin(outDir: string): Plugin {
  let css = "";
  let js = "";

  return {
    name: "plannar-inline-assets",
    enforce: "post",
    apply: "build",

    generateBundle(_opts: unknown, bundle: Record<string, unknown>) {
      for (const [, chunk] of Object.entries(bundle)) {
        const ch = chunk as Record<string, unknown>;
        if (ch.type === "asset" && typeof ch.source === "string") {
          if ((ch.fileName as string).endsWith(".css")) {
            css += ch.source;
          }
        }
        if (ch.type === "chunk") {
          js += (chunk as { code: string }).code;
        }
      }
    },

    closeBundle() {
      try {
        const safeJs = js.replace(/<\//g, "<\\/");
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
${safeJs}
</script>
</body>
</html>`;
        writeFileSync(join(outDir, "index.html"), html, "utf-8");

        const entries = readdirSync(outDir);
        for (const entry of entries) {
          if (entry !== "index.html") {
            rmSync(join(outDir, entry), { force: true });
          }
        }
      } catch {
        // build may have failed — ignore cleanup errors
      }
    },
  };
}
