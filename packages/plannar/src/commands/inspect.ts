import { defineCommand } from "citty";
import { get as httpGet, type ClientRequest, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import { resolve as resolvePath } from "node:path";
import { normalizeHost, findAllEditorPorts } from "./status.js";
import { resolveConfig } from "../config.js";

export type InspectResult = {
  error: boolean;
  message: string | null;
};

function extractErrorMessage(body: string): string {
  // Vite 6 HTML error overlay: `const error = {...}` embedded in a <script> tag
  const vite6Match = body.match(/const error\s*=\s*(\{[^}]+\})/);
  if (vite6Match) {
    try {
      const parsed = JSON.parse(vite6Match[1]);
      if (parsed.message) {
        let msg = parsed.message;
        if (parsed.stack) msg += `\n${parsed.stack}`;
        if (parsed.frame) msg += `\n${parsed.frame}`;
        return msg;
      }
    } catch {
      // fall through
    }
  }

  // Older Vite error payload
  const payloadMatch = body.match(/window\.__vite_error_payload__\s*=\s*(\{[\s\S]*?\});/);
  if (payloadMatch) {
    try {
      const payload = JSON.parse(payloadMatch[1]);
      if (payload.err?.message) {
        let msg = payload.err.message;
        if (payload.err.loc) {
          msg += `\n  at ${payload.err.loc.file || ""}:${payload.err.loc.line || ""}:${payload.err.loc.column || ""}`;
        }
        if (payload.err.stack) msg += `\n${payload.err.stack}`;
        return msg;
      }
    } catch {
      // fall through
    }
  }

  // Plain text error (no HTML wrapping)
  if (body.startsWith("[vite]")) return body.trim();

  // Strip HTML tags and decode entities as a fallback
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[#\w]+;/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return stripped || "HTTP error";
}

export function inspectModule(
  url: string,
  https: boolean,
  timeout: number,
): Promise<InspectResult> {
  return new Promise((resolve) => {
    const getFn: (
      url: string,
      opts: { timeout: number; rejectUnauthorized?: boolean },
      cb: (res: IncomingMessage) => void,
    ) => ClientRequest = https ? (httpsGet as never) : (httpGet as never);

    const req = getFn(url, { timeout, rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 200) {
        res.resume();
        resolve({ error: false, message: null });
        return;
      }

      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on("end", () => {
        const message = extractErrorMessage(body);
        resolve({ error: true, message });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ error: true, message: "Request timed out" });
    });
    req.on("error", (err) => {
      resolve({ error: true, message: err.message });
    });
  });
}

export default defineCommand({
  meta: {
    name: "inspect",
    description: "Inspect the plan editor for compilation errors.",
  },
  args: {
    port: {
      type: "string",
      description: "Port of the editor to inspect (auto-discovered if not provided)",
    },
    host: {
      type: "string",
      description: "Host of the editor",
      default: "localhost",
    },
    plan: {
      type: "string",
      description: "Plan slug to check for errors (e.g. 'hello-world')",
    },
  },
  async run({ args }) {
    const plan = args.plan as string | undefined;

    const cwd = process.cwd();
    const config = await resolveConfig(cwd);
    const currentRoot = resolvePath(cwd, config.plannarFolder);

    let host = args.host as string;
    let https = false;

    const editorConfig = config.viteConfig?.editor as Record<string, unknown> | undefined;
    if (editorConfig?.server) {
      const serverConfig = editorConfig.server as Record<string, unknown>;
      if (typeof serverConfig.host === "string") host = serverConfig.host;
      if (serverConfig.https) https = true;
    }

    const connectHost = normalizeHost(host);

    let port: number;
    if (args.port) {
      port = Number(args.port);
    } else {
      let startPort = 5173;
      if (editorConfig?.server) {
        const serverConfig = editorConfig.server as Record<string, unknown>;
        if (typeof serverConfig.port === "string" || typeof serverConfig.port === "number") {
          startPort = Number(serverConfig.port);
        }
      }

      const editors = await findAllEditorPorts(connectHost, startPort, 10, { https });
      const thisProject = editors.find((e) => e.root === currentRoot);

      if (!thisProject) {
        process.exitCode = 1;
        process.stderr.write("plannar inspect: no editor running for this project\n");
        return;
      }

      port = thisProject.port;
    }

    const protocol = https ? "https" : "http";
    const base = `${protocol}://${connectHost}:${port}`;
    const moduleUrl = plan ? `${base}/__plannar/plan/${plan}.js` : `${base}/src/main.tsx`;

    const result = await inspectModule(moduleUrl, https, 5000);

    if (result.error) {
      process.exitCode = 1;
      if (plan) {
        console.log(`Error in plan "${plan}":`);
      }
      console.log(result.message);
    }
  },
});
