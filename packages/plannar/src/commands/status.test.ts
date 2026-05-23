import { describe, it, expect, afterEach } from "vitest";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { checkPort, findEditorPort } from "./status.js";

describe("checkPort", () => {
  let server: Server | null = null;

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  function startServer(port: number, body: string, code: number = 200): Promise<void> {
    return new Promise((resolve) => {
      server = createServer((_req, res) => {
        res.writeHead(code);
        res.end(body);
      });
      server.listen(port, "127.0.0.1", () => resolve());
    });
  }

  it("returns true when server responds with Vite and plannar markers", async () => {
    const body =
      '<script type="module" src="/@vite/client"></script>\n<meta name="plannar-editor" content="true" />';
    await startServer(18990, body);
    const result = await checkPort("127.0.0.1", 18990, 2000);
    expect(result).toBe(true);
  });

  it("returns false when server responds with Vite marker but no plannar marker", async () => {
    await startServer(18994, '<script type="module" src="/@vite/client"></script>');
    const result = await checkPort("127.0.0.1", 18994, 2000);
    expect(result).toBe(false);
  });

  it("returns false when server responds without Vite marker", async () => {
    await startServer(18991, "<html>hello</html>");
    const result = await checkPort("127.0.0.1", 18991, 2000);
    expect(result).toBe(false);
  });

  it("returns false when server responds with non-200 status", async () => {
    const body =
      '<script type="module" src="/@vite/client"></script>\n<meta name="plannar-editor" content="true" />';
    await startServer(18992, body, 404);
    const result = await checkPort("127.0.0.1", 18992, 2000);
    expect(result).toBe(false);
  });

  it("returns false when nothing is listening", async () => {
    const result = await checkPort("127.0.0.1", 18993, 500);
    expect(result).toBe(false);
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

  function startViteServer(port: number): Promise<void> {
    return new Promise((resolve) => {
      server = createServer((_req, res) => {
        res.writeHead(200);
        res.end(
          '<script type="module" src="/@vite/client"></script>\n<meta name="plannar-editor" content="true" />',
        );
      });
      server.listen(port, "127.0.0.1", () => resolve());
    });
  }

  it("returns the port when server is on the start port", async () => {
    await startViteServer(19010);
    const result = await findEditorPort("127.0.0.1", 19010, 5);
    expect(result).toBe(19010);
  });

  it("finds the server when it is on a higher port", async () => {
    await startViteServer(19013);
    const result = await findEditorPort("127.0.0.1", 19010, 5);
    expect(result).toBe(19013);
  });

  it("returns null when no Vite server is found", async () => {
    const result = await findEditorPort("127.0.0.1", 19100, 3);
    expect(result).toBeNull();
  });
});
