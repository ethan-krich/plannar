import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { inspectModule } from "./inspect.js";

function getPort(server: Server): number {
  return (server.address() as AddressInfo).port;
}

describe("inspectModule", () => {
  let server: Server | null = null;

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  function startServer(
    handler: (res: { statusCode: number; body: string }) => void,
  ): Promise<number> {
    return new Promise((resolve) => {
      server = createServer((_req, res) => {
        const ctx = { statusCode: 200, body: "" };
        handler(ctx);
        res.writeHead(ctx.statusCode);
        res.end(ctx.body);
      });
      server.listen(0, "127.0.0.1", () => resolve(getPort(server!)));
    });
  }

  it("returns no error when server responds with 200", async () => {
    const port = await startServer((ctx) => {
      ctx.statusCode = 200;
      ctx.body = 'console.log("ok")';
    });
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 2000);
    expect(result.error).toBe(false);
    expect(result.message).toBeNull();
  });

  it("returns error with body when server responds with 500", async () => {
    const port = await startServer((ctx) => {
      ctx.statusCode = 500;
      ctx.body = "[vite] Internal server error: Unexpected token\n  at transform (plugin.ts:10)";
    });
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 2000);
    expect(result.error).toBe(true);
    expect(result.message).toContain("Internal server error");
    expect(result.message).toContain("Unexpected token");
  });

  it("returns error message when server responds with 404", async () => {
    const port = await startServer((ctx) => {
      ctx.statusCode = 404;
      ctx.body = "Not Found";
    });
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 2000);
    expect(result.error).toBe(true);
    expect(result.message).toContain("Not Found");
  });

  it("returns connection error when nothing is listening", async () => {
    const tmp = createServer();
    await new Promise<void>((r) => tmp.listen(0, "127.0.0.1", () => r()));
    const port = getPort(tmp);
    await new Promise<void>((r) => tmp.close(() => r()));
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 500);
    expect(result.error).toBe(true);
    expect(result.message).not.toBeNull();
  });

  it("handles empty 500 response body", async () => {
    const port = await startServer((ctx) => {
      ctx.statusCode = 500;
      ctx.body = "";
    });
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 2000);
    expect(result.error).toBe(true);
    expect(result.message).toBe("HTTP error");
  });

  it("extracts error from Vite HTML error overlay", async () => {
    const port = await startServer((ctx) => {
      ctx.statusCode = 500;
      ctx.body = `<!DOCTYPE html>
<html><head><title>Error</title></head>
<body>
  <div id="vite-error-overlay">
    <pre>Error: Something broke</pre>
  </div>
</body></html>`;
    });
    const result = await inspectModule(`http://127.0.0.1:${port}/module.js`, false, 2000);
    expect(result.error).toBe(true);
    expect(result.message).toContain("Error: Something broke");
    expect(result.message).not.toContain("<html");
  });
});
