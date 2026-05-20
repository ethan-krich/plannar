import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin, generateMdx } from "@plannar/core";
import type { BindingMeta } from "@plannar/core";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import type { Plugin } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = process.env.PLANNAR_CWD ?? resolve(__dirname, "../..");
const plannarRoot = join(workspaceRoot, ".plannar");

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

const plansDir = join(plannarRoot, "plans");

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

const plannarPlansPlugin: Plugin = {
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
      return compiled;
    }
  },
  handleHotUpdate(ctx) {
    const mod = ctx.server.moduleGraph.getModuleById("\0plannar-plans");
    if (mod) {
      void ctx.server.reloadModule(mod);
    }
  },
};

export default defineConfig({
  plugins: [tailwindcss(), react(), mdxPlugin({ bindings: shadcnBindings }), plannarPlansPlugin],
  server: {
    fs: {
      allow: [__dirname, workspaceRoot],
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
});
