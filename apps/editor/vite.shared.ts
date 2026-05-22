import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin, generateMdx } from "@plannar/core";
import type { BindingMeta } from "@plannar/core";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";

export const shadcnBindings: Record<string, BindingMeta> = {
  input: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  checkbox: {
    valueProp: "checked",
    changeProp: "onCheckedChange",
    extract: "e",
  },
};

const SAFE_PLAN_SEGMENT = /^[a-z0-9][a-z0-9_-]*$/;

export function isSafePlanSlug(slug: string): boolean {
  if (!slug || slug.includes("\\") || slug.startsWith("/") || slug.endsWith("/")) {
    return false;
  }

  return slug.split("/").every((segment) => SAFE_PLAN_SEGMENT.test(segment));
}

export function resolvePlanPath(plansDir: string, slug: string): string | null {
  if (!isSafePlanSlug(slug)) {
    return null;
  }

  const plansRoot = resolve(plansDir);
  const planPath = resolve(plansRoot, `${slug}.mdx`);
  const plansPrefix = `${plansRoot}${process.platform === "win32" ? "\\" : "/"}`;

  return planPath.startsWith(plansPrefix) ? planPath : null;
}

function hoistImports(code: string): string {
  const imports: string[] = [];
  const rest: string[] = [];

  for (const line of code.split("\n")) {
    if (line.startsWith("import ")) {
      imports.push(line);
    } else {
      rest.push(line);
    }
  }

  return [...imports, ...rest].join("\n");
}

function createPlannarPlansPlugin(plansDir: string): Plugin {
  return {
    name: "plannar-plans",
    resolveId(id: string) {
      if (id === "virtual:plannar-plans") return "\0plannar-plans";

      const planMatch = id.match(/^virtual:plannar-plan\/(.+)$/);
      if (planMatch && isSafePlanSlug(planMatch[1])) {
        return `\0plannar-plan/${planMatch[1]}`;
      }

      const httpMatch = id.match(/^\/__plannar\/plan\/(.+)\.js$/);
      if (httpMatch && isSafePlanSlug(httpMatch[1])) {
        return `\0plannar-plan/${httpMatch[1]}`;
      }
    },
    async load(id: string) {
      if (id === "\0plannar-plans") {
        let files: string[] = [];

        try {
          files = readdirSync(plansDir).filter((file) => file.endsWith(".mdx"));
        } catch {
          // Plans directory does not exist yet.
        }

        return [
          `export const plans = ${JSON.stringify(files)};`,
          `export const plansDir = ${JSON.stringify(plansDir)};`,
        ].join("\n");
      }

      if (!id.startsWith("\0plannar-plan/")) {
        return;
      }

      const planName = id.slice("\0plannar-plan/".length);
      const planPath = resolvePlanPath(plansDir, planName);

      if (!planPath || !existsSync(planPath)) {
        return "export default function() { return null; }";
      }

      const raw = readFileSync(planPath, "utf-8");
      return hoistImports(
        await generateMdx(planPath, {
          content: raw,
          bindings: shadcnBindings,
          development: true,
        }),
      );
    },
    handleHotUpdate(ctx) {
      const plansListMod = ctx.server.moduleGraph.getModuleById("\0plannar-plans");

      const plansPrefix = resolve(plansDir);
      const pathSep = process.platform === "win32" ? "\\" : "/";
      const prefix = `${plansPrefix}${pathSep}`;

      if (ctx.file.startsWith(prefix) && ctx.file.endsWith(".mdx")) {
        const slug = ctx.file.slice(prefix.length, -".mdx".length).replaceAll("\\", "/");
        const planMod = ctx.server.moduleGraph.getModuleById(`\0plannar-plan/${slug}`);

        if (plansListMod) void ctx.server.reloadModule(plansListMod);
        if (planMod) void ctx.server.reloadModule(planMod);
      } else if (plansListMod) {
        void ctx.server.reloadModule(plansListMod);
      }
    },
  };
}

function createGlobalCssPlugin(): Plugin {
  return {
    name: "plannar-global-css",
    resolveId(id: string) {
      if (id === "virtual:plannar-global-css") return "\0plannar-global-css";
    },
    load(id: string) {
      if (id !== "\0plannar-global-css") {
        return;
      }

      const globalCss = process.env.PLANNAR_GLOBAL_CSS;
      const cssFilePath = process.env.PLANNAR_CSS_FILE_PATH;
      const imports: string[] = [];

      if (globalCss && existsSync(globalCss)) {
        imports.push(globalCss);
      }

      if (cssFilePath && existsSync(cssFilePath)) {
        imports.push(cssFilePath);
      }

      return imports.map((filePath) => `import '${filePath}';`).join("\n") || "";
    },
  };
}

export function injectTailwindSource(css: string, plannarRoot: string): string {
  const tailwindImport = '@import "tailwindcss";';
  const sourceDirective = `@source ${JSON.stringify(plannarRoot.replaceAll("\\", "/"))};`;

  if (!css.includes(tailwindImport) || css.includes(sourceDirective)) {
    return css;
  }

  return css.replace(tailwindImport, `${tailwindImport}\n${sourceDirective}`);
}

function createTailwindSourcePlugin(plannarRoot: string): Plugin {
  return {
    name: "plannar-tailwind-source",
    enforce: "pre",
    load(id: string) {
      if (!id.endsWith("/src/index.css")) {
        return;
      }

      return injectTailwindSource(readFileSync(id, "utf-8"), plannarRoot);
    },
  };
}

type CreateEditorViteConfigOptions = {
  appDir: string;
  workspaceRoot: string;
};

export function createEditorViteConfig({
  appDir,
  workspaceRoot,
}: CreateEditorViteConfigOptions): UserConfig {
  const plannarFolder = process.env.PLANNAR_FOLDER || ".plannar";
  const plannarRoot = join(workspaceRoot, plannarFolder);
  const plansDir = join(plannarRoot, "plans");

  return {
    plugins: [
      tailwindcss(),
      react(),
      mdxPlugin({ bindings: shadcnBindings, development: true }),
      createPlannarPlansPlugin(plansDir),
      createGlobalCssPlugin(),
      createTailwindSourcePlugin(plannarRoot),
    ],
    server: {
      fs: {
        allow: [appDir, workspaceRoot],
      },
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: [
        {
          find: /^@\//,
          replacement: `${plannarRoot}/`,
        },
      ],
    },
  };
}
