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

export type EditorInfo = {
  port: number;
  root: string;
};

export async function findEditorPort(
  host: string,
  startPort: number,
  scanCount: number = 10,
  options: CheckPortOptions = {},
): Promise<EditorInfo | null> {
  const editors = await findAllEditorPorts(host, startPort, scanCount, options);
  return editors.length > 0 ? editors[0] : null;
}

export async function findAllEditorPorts(
  host: string,
  startPort: number,
  scanCount: number = 10,
  options: CheckPortOptions = {},
): Promise<EditorInfo[]> {
  const ports = Array.from({ length: scanCount }, (_, i) => startPort + i);
  const results = await Promise.all(
    ports.map(async (port) => {
      const result = await checkPort(host, port, port === startPort ? 2000 : 1000, options);
      return result.running && result.root ? { port, root: result.root } : null;
    }),
  );
  return results.filter((r): r is EditorInfo => r !== null);
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
    const editors = await findAllEditorPorts(connectHost, port, 10, { https });

    const protocol = https ? "https" : "http";
    if (editors.length === 0) {
      console.log("✗ No editor is running");
      return;
    }

    const thisProject = editors.find((e) => e.root === currentRoot);
    const otherEditors = editors.filter((e) => e.root !== currentRoot);

    if (thisProject) {
      console.log(
        `✓ Editor running for this project at ${protocol}://${connectHost}:${thisProject.port}`,
      );
    } else {
      console.log("✗ No editor running for this project");
    }

    if (otherEditors.length > 0) {
      console.log("");
      console.log("Other editors:");
      for (const e of otherEditors) {
        console.log(`  ${protocol}://${connectHost}:${e.port} → ${e.root}`);
      }
    }
  },
});
