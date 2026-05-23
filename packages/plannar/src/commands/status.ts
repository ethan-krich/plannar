import { defineCommand } from "citty";
import { get as httpGet, type ClientRequest, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import { resolveConfig } from "../config.js";

const VITE_MARKER = "/@vite/client";
const PLANNAR_MARKER = 'name="plannar-editor"';
const MAX_BODY_BYTES = 256 * 1024;
const UNCONNECTABLE_HOSTS = new Set(["0.0.0.0", "::", "::0", "0:0:0:0:0:0:0:0"]);

export function normalizeHost(host: string): string {
  if (UNCONNECTABLE_HOSTS.has(host)) return "127.0.0.1";
  return host;
}

export type CheckPortOptions = {
  https?: boolean;
};

export function checkPort(
  host: string,
  port: number,
  timeout: number,
  options: CheckPortOptions = {},
): Promise<boolean> {
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
          resolve(false);
          return;
        }
        let body = "";
        let received = 0;
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          body += chunk.toString();
          if (body.includes(VITE_MARKER) && body.includes(PLANNAR_MARKER)) {
            req.destroy();
            resolve(true);
            return;
          }
          if (received >= MAX_BODY_BYTES) {
            req.destroy();
            resolve(false);
          }
        });
        res.on("end", () => resolve(false));
      },
    );
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
  options: CheckPortOptions = {},
): Promise<number | null> {
  if (await checkPort(host, startPort, 2000, options)) return startPort;

  const results = await Promise.all(
    Array.from({ length: scanCount - 1 }, (_, i) =>
      checkPort(host, startPort + 1 + i, 1000, options),
    ),
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
    const foundPort = await findEditorPort(connectHost, port, 10, { https });

    const protocol = https ? "https" : "http";
    if (foundPort !== null) {
      console.log(`✓ Editor is running at ${protocol}://${connectHost}:${foundPort}`);
    } else {
      console.log(`✗ Editor is not running`);
    }
  },
});
