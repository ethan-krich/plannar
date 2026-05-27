import { defineCommand } from "citty";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { resolveConfig, merge } from "../config.js";

function findEditorRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const bundled = resolve(dir, "editor");
    if (existsSync(resolve(bundled, "vite.config.ts"))) return bundled;

    const dev = resolve(dir, "apps", "editor");
    if (existsSync(resolve(dev, "vite.config.ts"))) return dev;

    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Could not find editor relative to CLI package");
}

export default defineCommand({
  meta: {
    name: "editor",
    description: "Start the plan editor in dev mode with HMR",
  },
  args: {
    port: {
      type: "string",
      description: "Port to listen on",
      default: "5173",
    },
    host: {
      type: "string",
      description: "Host to listen on",
      default: "localhost",
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const config = await resolveConfig(cwd);

    process.env.PLANNAR_CWD = cwd;
    process.env.PLANNAR_FOLDER = config.plannarFolder;
    process.env.PLANNAR_EXPORTS_FOLDER = config.exportsFolder;

    if (config.globalCss) {
      process.env.PLANNAR_GLOBAL_CSS = resolve(cwd, config.globalCss);
    }
    if (config.cssFilePath) {
      process.env.PLANNAR_CSS_FILE_PATH = resolve(cwd, config.cssFilePath);
    }
    if (config.meta) {
      process.env.PLANNAR_META = JSON.stringify(config.meta);
    }

    const moduleDir = fileURLToPath(new URL(".", import.meta.url));
    const editorRoot = findEditorRoot(moduleDir);
    const configFile = resolve(editorRoot, "vite.config.ts");

    const baseServerConfig: Record<string, unknown> = {
      configFile,
      root: editorRoot,
      server: {
        fs: {
          allow: [editorRoot, cwd],
        },
        port: Number(args.port),
        host: args.host,
      },
    };

    const serverConfig = config.viteConfig?.editor
      ? merge(baseServerConfig, config.viteConfig.editor as Record<string, unknown>)
      : baseServerConfig;

    const server = await createServer(serverConfig as Parameters<typeof createServer>[0]);

    await server.listen();
    server.printUrls();
  },
});
