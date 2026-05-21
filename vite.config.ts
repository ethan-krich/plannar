import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin, generateMdx } from "@plannar/core";
import type { BindingMeta } from "@plannar/core";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const shadcnBindings: Record<string, BindingMeta> = {
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

const plannarFolder = process.env.PLANNAR_FOLDER || ".plannar";
const plansDir = join(process.env.PLANNAR_CWD ?? process.cwd(), plannarFolder, "plans");
const plannarRoot = join(process.env.PLANNAR_CWD ?? process.cwd(), plannarFolder);

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

const plannarPlansPlugin = {
  name: "plannar-plans",
  resolveId(id: string) {
    if (id === "virtual:plannar-plans") return "\0plannar-plans";
    const planMatch = id.match(/^virtual:plannar-plan\/(.+)$/);
    if (planMatch) return `\0plannar-plan/${planMatch[1]}`;
    const httpMatch = id.match(/^\/__plannar\/plan\/(.+)\.js$/);
    if (httpMatch) return `\0plannar-plan/${httpMatch[1]}`;
  },
  async load(id: string) {
    if (id === "\0plannar-plans") {
      let files: string[] = [];
      try {
        files = readdirSync(plansDir).filter((f) => f.endsWith(".mdx"));
      } catch {
        // plans directory doesn't exist yet
      }
      return [
        `export const plans = ${JSON.stringify(files)};`,
        `export const plansDir = ${JSON.stringify(plansDir)};`,
      ].join("\n");
    }
    if (id.startsWith("\0plannar-plan/")) {
      const planName = id.slice("\0plannar-plan/".length);
      const planPath = join(plansDir, `${planName}.mdx`);
      if (!existsSync(planPath)) {
        return "export default function() { return null; }";
      }
      const raw = readFileSync(planPath, "utf-8");
      const compiled = hoistImports(
        await generateMdx(planPath, {
          content: raw,
          bindings: shadcnBindings,
        }),
      );
      return compiled.replace(
        /from\s+"@\/(.+?)"/g,
        (_: string, path: string) => `from "${resolve(plannarRoot, path)}.tsx"`,
      );
    }
  },
  handleHotUpdate(ctx: any) {
    const mod = ctx.server.moduleGraph.getModuleById("\0plannar-plans");
    if (mod) {
      void ctx.server.reloadModule(mod);
    }
  },
};

const globalCssPlugin = {
  name: "plannar-global-css",
  resolveId(id: string) {
    if (id === "virtual:plannar-global-css") return "\0plannar-global-css";
  },
  load(id: string) {
    if (id === "\0plannar-global-css") {
      const globalCss = process.env.PLANNAR_GLOBAL_CSS;
      const cssFilePath = process.env.PLANNAR_CSS_FILE_PATH;
      const imports: string[] = [];
      if (globalCss && existsSync(globalCss)) {
        imports.push(globalCss);
      }
      if (cssFilePath && existsSync(cssFilePath)) {
        imports.push(cssFilePath);
      }
      return imports.map((p) => `import '${p}';`).join("\n") || "";
    }
  },
};

export default defineConfig({
  root: "apps/editor",
  plugins: [
    tailwindcss(),
    react(),
    mdxPlugin({ bindings: shadcnBindings }),
    plannarPlansPlugin,
    globalCssPlugin,
  ],
  server: {
    fs: {
      allow: [resolve(__dirname, "apps/editor"), process.cwd()],
    },
  },
  resolve: {
    alias: {
      "@": join(process.env.PLANNAR_CWD ?? process.cwd(), plannarFolder),
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    cache: true,
  },
});
