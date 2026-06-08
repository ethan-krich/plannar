import { describe, it, expect, afterEach } from "vitest";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { checkPort, findEditorPort, normalizeHost } from "./status.js";

const rootMeta = '<meta name="plannar-root" content="/test/plannar" />';
const editorBody = [
  rootMeta,
  '<meta name="plannar-editor" content="true" />',
  '<script type="module" src="/@vite/client"></script>',
].join("\n");

function getPort(server: Server): number {
  return (server.address() as AddressInfo).port;
}

describe("checkPort", () => {
  let server: Server | null = null;

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  function startServer(body: string, code: number = 200): Promise<number> {
    return new Promise((resolve) => {
      server = createServer((_req, res) => {
        res.writeHead(code);
        res.end(body);
      });
      server.listen(0, "127.0.0.1", () => resolve(getPort(server!)));
    });
  }

  it("returns running=true with root when server responds with all markers", async () => {
    const port = await startServer(editorBody);
    const result = await checkPort("127.0.0.1", port, 2000);
    expect(result.running).toBe(true);
    expect(result.root).toBe("/test/plannar");
  });

  it("returns running=false when server responds with Vite marker but no plannar marker", async () => {
    const port = await startServer('<script type="module" src="/@vite/client"></script>');
    const result = await checkPort("127.0.0.1", port, 2000);
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
  });

  it("returns running=false when server responds without Vite marker", async () => {
    const port = await startServer("<html>hello</html>");
    const result = await checkPort("127.0.0.1", port, 2000);
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
  });

  it("returns running=false when server responds with non-200 status", async () => {
    const port = await startServer(editorBody, 404);
    const result = await checkPort("127.0.0.1", port, 2000);
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
  });

  it("returns running=false when nothing is listening", async () => {
    const tmp = createServer();
    await new Promise<void>((r) => tmp.listen(0, "127.0.0.1", () => r()));
    const port = getPort(tmp);
    await new Promise<void>((r) => tmp.close(() => r()));
    const result = await checkPort("127.0.0.1", port, 500);
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
  });

  it("aborts and returns running=false when response body exceeds the size limit without markers", async () => {
    server = createServer((_req, res) => {
      res.writeHead(200);
      const chunk = Buffer.alloc(64 * 1024, "x");
      const interval = setInterval(() => {
        if (!res.write(chunk)) {
        }
      }, 5);
      res.on("close", () => clearInterval(interval));
    });
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", () => r()));
    const port = getPort(server);
    const result = await checkPort("127.0.0.1", port, 5000);
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
  });

  it("returns root=null when markers match but HTML has no plannar-root meta", async () => {
    const body =
      '<meta name="plannar-editor" content="true" />\n<script type="module" src="/@vite/client"></script>';
    const port = await startServer(body);
    const result = await checkPort("127.0.0.1", port, 2000);
    expect(result.running).toBe(true);
    expect(result.root).toBeNull();
  });
});

describe("checkPort with https option", () => {
  it("uses the https client (TLS handshake against plain HTTP server fails)", async () => {
    const httpServer = createServer((_req, res) => {
      res.writeHead(200);
      res.end(editorBody);
    });
    await new Promise<void>((r) => httpServer.listen(0, "127.0.0.1", () => r()));
    const port = (httpServer.address() as AddressInfo).port;
    const result = await checkPort("127.0.0.1", port, 1000, { https: true });
    expect(result.running).toBe(false);
    expect(result.root).toBeNull();
    await new Promise<void>((r) => httpServer.close(() => r()));
  });
});

describe("findEditorPort", () => {
  let server: Server | null = null;

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  function startViteServer(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      server = createServer((_req, res) => {
        res.writeHead(200);
        res.end(editorBody);
      });
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => resolve(getPort(server!)));
    });
  }

  async function findFreePort(): Promise<number> {
    const tmp = createServer();
    await new Promise<void>((r) => tmp.listen(0, "127.0.0.1", () => r()));
    const port = (tmp.address() as AddressInfo).port;
    await new Promise<void>((r) => tmp.close(() => r()));
    return port;
  }

  it("returns the port and root when server is on the start port", async () => {
    const port = await startViteServer(0);
    const result = await findEditorPort("127.0.0.1", port, 5);
    expect(result).toEqual({ port, root: "/test/plannar" });
  });

  it("finds the server when it is on a higher port", async () => {
    const free = await findFreePort();
    const actual = await startViteServer(free);
    const result = await findEditorPort("127.0.0.1", actual - 3, 5);
    expect(result).toEqual({ port: actual, root: "/test/plannar" });
  });

  it("returns null when no Vite server is found", async () => {
    const free = await findFreePort();
    const result = await findEditorPort("127.0.0.1", free, 3);
    expect(result).toBeNull();
  });
});

describe("normalizeHost", () => {
  it("rewrites 0.0.0.0 to 127.0.0.1", () => {
    expect(normalizeHost("0.0.0.0")).toBe("127.0.0.1");
  });

  it("rewrites :: to 127.0.0.1", () => {
    expect(normalizeHost("::")).toBe("127.0.0.1");
  });

  it("leaves localhost untouched", () => {
    expect(normalizeHost("localhost")).toBe("localhost");
  });

  it("leaves a regular hostname untouched", () => {
    expect(normalizeHost("example.local")).toBe("example.local");
  });
});
