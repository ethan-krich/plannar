import { defineCommand } from "citty";
import { get as httpGet, type ClientRequest, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import { resolve as resolvePath } from "node:path";
import { resolveConfig } from "../config.js";

const VITE_MARKER = "/@vite/client";
const PLANNAR_MARKER = 'name="plannar-editor"';
const MAX_BODY_BYTES = 256 * 1024;
const UNCONNECTABLE_HOSTS = new Set(["0.0.0.0", "::", "::0", "0:0:0:0:0:0:0:0"]);

export function normalizeHost(host: string): string {
  if (UNCONNECTABLE_HOSTS.has(host)) return "127.0.0.1";
  return host;
}

function extractPlannarRoot(body: string): string | null {
  const match = body.match(/<meta\s+name="plannar-root"\s+content="([^"]*)"/);
  return match ? match[1] : null;
}

export type CheckPortOptions = {
  https?: boolean;
};

export type CheckPortResult = {
  running: boolean;
  root: string | null;
};

export function checkPort(
  host: string,
  port: number,
  timeout: number,
  options: CheckPortOptions = {},
): Promise<CheckPortResult> {
  return new Promise((resolve) => {
    const protocol = options.https ? "https" : "http";
    const getFn: (
      url: string,
      opts: { timeout: number; rejectUnauthorized?: boolean },
      cb: (res: IncomingMessage) => void,
    ) => ClientRequest = options.https ? (httpsGet as never) : (httpGet as never);

    const req = getFn(
      `${protocol}://${host}:${port}`,
      { timeout, rejectUnauthorized: false },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve({ running: false, root: null });
          return;
        }
        let body = "";
        let received = 0;
        let running = false;
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          body += chunk.toString();
          if (!running && body.includes(VITE_MARKER) && body.includes(PLANNAR_MARKER)) {
            running = true;
          }
          if (received >= MAX_BODY_BYTES) {
            req.destroy();
            resolve({
              running,
              root: running ? extractPlannarRoot(body) : null,
            });
          }
        });
        res.on("end", () => {
          resolve({
            running,
            root: running ? extractPlannarRoot(body) : null,
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ running: false, root: null });
    });
    req.on("error", () => resolve({ running: false, root: null }));
  });
}

export async function findEditorPort(
  host: string,
  startPort: number,
  scanCount: number = 10,
  options: CheckPortOptions = {},
): Promise<{ port: number; root: string } | null> {
  const result = await checkPort(host, startPort, 2000, options);
  if (result.running) return { port: startPort, root: result.root! };

  const results = await Promise.all(
    Array.from({ length: scanCount - 1 }, (_, i) =>
      checkPort(host, startPort + 1 + i, 1000, options),
    ),
  );
  const idx = results.findIndex((r) => r.running);
  if (idx >= 0) {
    return { port: startPort + 1 + idx, root: results[idx].root! };
  }
  return null;
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
    const currentRoot = resolvePath(cwd, config.plannarFolder);

    let port = Number(args.port);
    let host = args.host as string;
    let https = false;

    const editorConfig = config.viteConfig?.editor as Record<string, unknown> | undefined;
    if (editorConfig?.server) {
      const serverConfig = editorConfig.server as Record<string, unknown>;
      if (typeof serverConfig.port === "string" || typeof serverConfig.port === "number") {
        port = Number(serverConfig.port);
      }
      if (typeof serverConfig.host === "string") host = serverConfig.host;
      if (serverConfig.https) https = true;
    }

    const connectHost = normalizeHost(host);
    const found = await findEditorPort(connectHost, port, 10, { https });

    const protocol = https ? "https" : "http";
    if (found !== null) {
      const sameProject = found.root === currentRoot;
      const label = sameProject ? "this project" : "different project";
      console.log(`✓ Editor running (${label}) at ${protocol}://${connectHost}:${found.port}`);
    } else {
      console.log(`✗ Editor is not running`);
    }
  },
});
