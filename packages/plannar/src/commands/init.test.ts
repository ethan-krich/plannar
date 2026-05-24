import { describe, it, expect, vi, afterEach } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
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
      expect(existsSync(join(plannarDir, "package.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "tsconfig.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "lib", "utils.ts"))).toBe(true);
      expect(existsSync(join(plannarDir, "plans", "hello-world.mdx"))).toBe(true);
      expect(existsSync(join(plannarDir, "node_modules", ".plannar-junk.css"))).toBe(true);

      // No longer created by init
      expect(existsSync(join(plannarDir, "config.json"))).toBe(false);
      expect(existsSync(join(plannarDir, "index.css"))).toBe(false);

      const pkg = JSON.parse(readFileSync(join(plannarDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("plannar");
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");
      expect(pkg.dependencies).toEqual({ clsx: "^2.1.1", "tailwind-merge": "^3.6.0" });

      const tsconfig = JSON.parse(readFileSync(join(plannarDir, "tsconfig.json"), "utf-8"));
      expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");
      expect(tsconfig.compilerOptions.baseUrl).toBe(".");
      expect(tsconfig.compilerOptions.paths).toEqual({ "@/*": ["./*"] });

      const utils = readFileSync(join(plannarDir, "lib", "utils.ts"), "utf-8");
      expect(utils).toContain("export function cn");

      const components = JSON.parse(readFileSync(join(plannarDir, "components.json"), "utf-8"));
      expect(components.tailwind.css).toBe("node_modules/.plannar-junk.css");

      const junk = readFileSync(join(plannarDir, "node_modules", ".plannar-junk.css"), "utf-8");
      expect(junk).toContain("plannar");

      const mdx = readFileSync(join(plannarDir, "plans", "hello-world.mdx"), "utf-8");
      expect(mdx).toContain("# Hello, Plannar!");
      expect(mdx).toContain("plannar editor");
      expect(mdx).toContain("plannar export");

      expect(execSpy).toHaveBeenNthCalledWith(
        1,
        "npx shadcn@latest add button",
        expect.any(Object),
      );
      expect(execSpy).toHaveBeenNthCalledWith(2, "npm install", expect.any(Object));
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
      expect(execSpy).toHaveBeenCalledTimes(2);
      expect(execSpy).toHaveBeenNthCalledWith(
        1,
        "npx shadcn@latest add button",
        expect.any(Object),
      );
      expect(execSpy).toHaveBeenNthCalledWith(2, "npm install", expect.any(Object));
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
      expect(execSpy).toHaveBeenCalledTimes(3);
      expect(execSpy).toHaveBeenNthCalledWith(
        1,
        "npx shadcn@latest add button",
        expect.any(Object),
      );
      expect(execSpy).toHaveBeenNthCalledWith(2, "npm install", expect.any(Object));
      expect(execSpy).toHaveBeenNthCalledWith(3, "npx skills add ethan-krich/plannar@plannar", {
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
      expect(execSpy).toHaveBeenCalledTimes(2);
      expect(execSpy).toHaveBeenNthCalledWith(
        1,
        "npx shadcn@latest add button",
        expect.any(Object),
      );
      expect(execSpy).toHaveBeenNthCalledWith(2, "npm install", expect.any(Object));
    } finally {
      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("detects external imports from shadcn component files", async () => {
    const tmp = useTempDir("detect-imports");
    mkdirSync(join(tmp, ".plannar", "components", "ui"), { recursive: true });
    mkdirSync(join(tmp, ".plannar", "lib"), { recursive: true });

    writeFileSync(
      join(tmp, ".plannar", "lib", "utils.ts"),
      `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      "utf-8",
    );

    writeFileSync(
      join(tmp, ".plannar", "components", "ui", "button.tsx"),
      `import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Button(props: ButtonPrimitive.Props) {
  return <ButtonPrimitive className={cn("rounded")} {...props} />;
}`,
      "utf-8",
    );

    writeFileSync(
      join(tmp, ".plannar", "components", "ui", "icon.tsx"),
      `import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Icon() {
  return <Star className={cn("size-4")} />;
}`,
      "utf-8",
    );

    try {
      const { collectExternalImports } = await import("./init.js");
      const plannarDir = join(tmp, ".plannar");
      const imports = collectExternalImports(plannarDir);

      expect(imports.sort()).toEqual(
        [
          "@base-ui/react",
          "class-variance-authority",
          "clsx",
          "lucide-react",
          "tailwind-merge",
        ].sort(),
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
