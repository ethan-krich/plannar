import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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

  const tmpDir = mkdtempSync(join(pkgDir, "..", ".tmp-"));
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

async function buildExportHtml(
  compiled: string,
  tmpDir: string,
  cwd: string,
  plannarFolder: string,
  options: ExportOptions,
): Promise<string> {
  const plannarDir = join(cwd, plannarFolder);
  const sourcePath = relative(tmpDir, plannarDir).replaceAll("\\", "/");

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
  if (options.globalCss) {
    const globalCssAbs = resolve(cwd, options.globalCss);
    const globalCssRel = relative(tmpDir, globalCssAbs).replaceAll("\\", "/");
    cssImports += `@import "${globalCssRel}";\n`;
  }
  if (options.cssFilePath) {
    const cssFilePathAbs = resolve(cwd, options.cssFilePath);
    const cssFilePathRel = relative(tmpDir, cssFilePathAbs).replaceAll("\\", "/");
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

  writeFileSync(
    join(tmpDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body><div id="root"></div><script type="module" src="/plan.tsx"></script></body>
</html>`,
    "utf-8",
  );

  const outDir = join(tmpDir, "dist");

  const baseBuildConfig = {
    root: tmpDir,
    build: { outDir, minify: false },
    plugins: [tailwindcss(), react(), inlineAssetsPlugin(outDir)],
    resolve: { alias: { "@": plannarDir } },
    logLevel: "warn" as const,
  };

  const buildConfig = options.viteConfig
    ? deepMerge(baseBuildConfig as unknown as Record<string, unknown>, options.viteConfig)
    : baseBuildConfig;

  await build(buildConfig as Parameters<typeof build>[0]);

  return readFileSync(join(outDir, "index.html"), "utf-8");
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
