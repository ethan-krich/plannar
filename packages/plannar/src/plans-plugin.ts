import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";
import { generateMdx } from "@plannar/core";
import type { BindingMeta } from "@plannar/core";
import { shadcnBindings } from "@plannar/registry-metadata";

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

export function plannarPlansPlugin(
  cwd: string,
  plannarFolder = ".plannar",
  meta?: Record<string, BindingMeta>,
): Plugin {
  const plansDir = join(cwd, plannarFolder, "plans");
  const plannarRoot = join(cwd, plannarFolder);
  const bindings = { ...shadcnBindings, ...meta };

  return {
    name: "plannar-plans",
    resolveId(id) {
      if (id === "virtual:plannar-plans") return "\0plannar-plans";
      const planMatch = id.match(/^virtual:plannar-plan\/(.+)$/);
      if (planMatch) return `\0plannar-plan/${planMatch[1]}`;
    },
    async load(id) {
      if (id === "\0plannar-plans") {
        let files: string[] = [];
        try {
          files = readdirSync(plansDir).filter((f) => f.endsWith(".mdx"));
        } catch {
          // plans directory doesn't exist yet — return empty
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
            bindings,
          }),
        );
        return compiled.replace(
          /from\s+"@\/(.+?)"/g,
          (_: string, path: string) => `from "${resolve(plannarRoot, path)}.tsx"`,
        );
      }
    },
    handleHotUpdate(ctx) {
      const mod = ctx.server.moduleGraph.getModuleById("\0plannar-plans");
      if (mod) {
        void ctx.server.reloadModule(mod);
      }
    },
  };
}
