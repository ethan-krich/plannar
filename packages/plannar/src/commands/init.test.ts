import { describe, it, expect, vi, afterEach } from "vitest";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  lstatSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const { execSpy, confirmMock, selectMock, checkboxMock } = vi.hoisted(() => ({
  execSpy: vi.fn(),
  confirmMock: vi.fn(),
  selectMock: vi.fn(),
  checkboxMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execSync: execSpy }));

vi.mock("@inquirer/prompts", () => ({
  select: selectMock,
  confirm: confirmMock,
  checkbox: checkboxMock,
}));

function useTempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `plannar-init-${label}-`));
}

type SkillFiles = string | Record<string, string>;

function createFakeSkillRepo(repoDir: string, skills: Record<string, SkillFiles>) {
  const skillsDir = join(repoDir, "skills");
  mkdirSync(skillsDir, { recursive: true });
  for (const [name, files] of Object.entries(skills)) {
    const skillDir = join(skillsDir, name);
    mkdirSync(skillDir, { recursive: true });
    if (typeof files === "string") {
      writeFileSync(join(skillDir, "SKILL.md"), files, "utf-8");
    } else {
      for (const [relPath, content] of Object.entries(files)) {
        const fullPath = join(skillDir, relPath);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, content, "utf-8");
      }
    }
  }
}

function cleanCloneDir() {
  try {
    rmSync(join(tmpdir(), "plannar-init"), { recursive: true, force: true });
  } catch {
    // ok
  }
}

describe("init command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    execSpy.mockReset();
    confirmMock.mockReset();
    selectMock.mockReset();
    checkboxMock.mockReset();
    cleanCloneDir();
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

    execSpy.mockReturnValue(Buffer.from(""));

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

  it("installs skill to local .agents when user confirms", async () => {
    const tmp = useTempDir("install-yes");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    confirmMock.mockResolvedValueOnce(true);
    selectMock.mockResolvedValueOnce("local");
    checkboxMock.mockResolvedValueOnce(["general"]);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar skill" });
        return Buffer.from("");
      }
      return Buffer.from("");
    });

    try {
      const { default: initCmd } = await import("./init.js");
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();

      expect(execSpy).toHaveBeenNthCalledWith(
        1,
        "npx shadcn@latest add button",
        expect.any(Object),
      );
      expect(execSpy).toHaveBeenNthCalledWith(2, "npm install", expect.any(Object));

      const skillPath = join(tmp, ".agents", "skills", "plannar", "SKILL.md");
      expect(existsSync(skillPath)).toBe(true);
      expect(readFileSync(skillPath, "utf-8")).toBe("# Plannar skill");
    } finally {
      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs skill to both agents with symlink", async () => {
    const tmp = useTempDir("install-both-symlink");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    confirmMock.mockResolvedValueOnce(true);
    selectMock.mockResolvedValueOnce("local");
    checkboxMock.mockResolvedValueOnce(["general", "claude"]);
    confirmMock.mockResolvedValueOnce(true);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar skill" });
        return Buffer.from("");
      }
      return Buffer.from("");
    });

    try {
      const { default: initCmd } = await import("./init.js");
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();

      const generalDir = join(tmp, ".agents", "skills", "plannar");
      expect(existsSync(join(generalDir, "SKILL.md"))).toBe(true);

      const claudeDir = join(tmp, ".claude", "skills", "plannar");
      expect(existsSync(claudeDir)).toBe(true);
      expect(lstatSync(claudeDir).isSymbolicLink()).toBe(true);
      expect(readFileSync(join(claudeDir, "SKILL.md"), "utf-8")).toBe("# Plannar skill");
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

    confirmMock.mockResolvedValueOnce(false);

    execSpy.mockReturnValue(Buffer.from(""));

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

      expect(existsSync(join(tmp, ".agents", "skills"))).toBe(false);
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
