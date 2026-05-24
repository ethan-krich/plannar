import { describe, it, expect, vi, afterEach } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { execSpy, questionCb } = vi.hoisted(() => ({
  execSpy: vi.fn(),
  questionCb: vi.fn<(cb: (answer: string) => void) => void>(),
}));

vi.mock("node:child_process", () => ({ execSync: execSpy }));

vi.mock("node:readline", () => ({
  createInterface: () => ({
    question: (_prompt: string, cb: (answer: string) => void) => {
      questionCb(cb);
      return undefined as unknown as ReturnType<typeof import("node:readline").createInterface>;
    },
    close: vi.fn(),
  }),
}));

function useTempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `plannar-init-${label}-`));
}

describe("init command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    execSpy.mockReset();
    questionCb.mockReset();
  });

  it("creates the expected files in .plannar/", async () => {
    const tmp = useTempDir("creates-files");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);

    try {
      const { default: initCmd } = await import("./init.js");
      const meta = (initCmd as { meta: { name: string } }).meta;
      expect(meta.name).toBe("init");

      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();

      const plannarDir = join(tmp, ".plannar");

      expect(existsSync(join(plannarDir, "components.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "config.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "index.css"))).toBe(true);
      expect(existsSync(join(plannarDir, "package.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "tsconfig.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "plans", "hello-world.mdx"))).toBe(true);

      const pkg = JSON.parse(readFileSync(join(plannarDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("plannar");
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");

      const tsconfig = JSON.parse(readFileSync(join(plannarDir, "tsconfig.json"), "utf-8"));
      expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");
      expect(tsconfig.compilerOptions.baseUrl).toBe(".");
      expect(tsconfig.compilerOptions.paths).toEqual({ "@/*": ["./*"] });

      const config = JSON.parse(readFileSync(join(plannarDir, "config.json"), "utf-8"));
      expect(config.plannarFolder).toBe(".plannar");
      expect(config.exportsFolder).toBe(".plannar/exports");
      expect(config.globalCss).toBe(".plannar/index.css");

      const css = readFileSync(join(plannarDir, "index.css"), "utf-8");
      expect(css).toContain('@import "tailwindcss"');
      expect(css).toContain("--background: oklch(1 0 0)");
      expect(css).toContain("@theme inline");

      const mdx = readFileSync(join(plannarDir, "plans", "hello-world.mdx"), "utf-8");
      expect(mdx).toContain("# Hello, Plannar!");
      expect(mdx).toContain("plannar editor");
      expect(mdx).toContain("plannar export");

      expect(execSpy).not.toHaveBeenCalled();
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("does not install skill when non-TTY", async () => {
    const tmp = useTempDir("no-tty");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    try {
      const { default: initCmd } = await import("./init.js");
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();
      expect(execSpy).not.toHaveBeenCalled();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs skill when user answers yes", async () => {
    const tmp = useTempDir("install-yes");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    questionCb.mockImplementation((cb: (answer: string) => void) => cb("y"));

    try {
      const { default: initCmd } = await import("./init.js");
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();
      expect(execSpy).toHaveBeenCalledWith("npx skills add ethan-krich/plannar@plannar -g -y", {
        stdio: "inherit",
      });
    } finally {
      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("skips skill install when user answers no", async () => {
    const tmp = useTempDir("install-no");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    questionCb.mockImplementation((cb: (answer: string) => void) => cb("n"));

    try {
      const { default: initCmd } = await import("./init.js");
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();
      expect(execSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
