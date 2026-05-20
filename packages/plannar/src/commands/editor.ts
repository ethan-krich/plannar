import { defineCommand } from "citty";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

function findEditorRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = resolve(dir, "apps/editor/index.html");
    if (existsSync(candidate)) return resolve(dir, "apps/editor");
    dir = resolve(dir, "..");
  }
  throw new Error("Could not find apps/editor relative to CLI package");
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
    process.env.PLANNAR_CWD = cwd;
    const pkgDir = fileURLToPath(new URL("..", import.meta.url));
    const editorRoot = findEditorRoot(pkgDir);
    const configFile = resolve(editorRoot, "vite.config.ts");

    const server = await createServer({
      configFile,
      root: editorRoot,
      server: {
        fs: {
          allow: [editorRoot, cwd],
        },
        port: Number(args.port),
        host: args.host,
      },
    });

    await server.listen();
    server.printUrls();
  },
});
