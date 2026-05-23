import { defineCommand } from "citty";
import { get } from "node:http";
import { resolveConfig } from "../config.js";

const VITE_MARKER = "/@vite/client";
const PLANNAR_MARKER = 'name="plannar-editor"';

export function checkPort(host: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = get(`http://${host}:${port}`, { timeout }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }
      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString();
        if (body.includes(VITE_MARKER) && body.includes(PLANNAR_MARKER)) {
          req.destroy();
          resolve(true);
        }
      });
      res.on("end", () => resolve(false));
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

export async function findEditorPort(
  host: string,
  startPort: number,
  scanCount: number = 10,
): Promise<number | null> {
  if (await checkPort(host, startPort, 2000)) return startPort;

  const results = await Promise.all(
    Array.from({ length: scanCount - 1 }, (_, i) => checkPort(host, startPort + 1 + i, 1000)),
  );
  const idx = results.indexOf(true);
  return idx >= 0 ? startPort + 1 + idx : null;
}

export default defineCommand({
  meta: {
    name: "status",
    description: "Find which port the plan editor is running on",
  },
  args: {
    port: {
      type: "string",
      description: "Port to start scanning from",
      default: "5173",
    },
    host: {
      type: "string",
      description: "Host to check",
      default: "localhost",
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const config = await resolveConfig(cwd);

    let port = Number(args.port);
    let host = args.host as string;

    const editorConfig = config.viteConfig?.editor as Record<string, unknown> | undefined;
    if (editorConfig?.server) {
      const serverConfig = editorConfig.server as Record<string, unknown>;
      if (typeof serverConfig.port === "string" || typeof serverConfig.port === "number") {
        port = Number(serverConfig.port);
      }
      if (typeof serverConfig.host === "string") host = serverConfig.host;
    }

    const foundPort = await findEditorPort(host, port);

    if (foundPort !== null) {
      console.log(`✓ Editor is running at http://${host}:${foundPort}`);
    } else {
      console.log(`✗ Editor is not running`);
    }
  },
});
