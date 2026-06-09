import { describe, it, expect, vi, afterEach } from "vitest";
import {
  existsSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  lstatSync,
  readFileSync,
} from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";

const { execSpy, selectMock, confirmMock, checkboxMock } = vi.hoisted(() => ({
  execSpy: vi.fn(),
  selectMock: vi.fn(),
  confirmMock: vi.fn(),
  checkboxMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execSync: execSpy }));

vi.mock("@inquirer/prompts", () => ({
  select: selectMock,
  confirm: confirmMock,
  checkbox: checkboxMock,
}));

function useTempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `plannar-install-skills-${label}-`));
}

function createFakeSkillRepo(repoDir: string, skills: Record<string, string>) {
  const skillsDir = join(repoDir, "skills");
  mkdirSync(skillsDir, { recursive: true });
  for (const [name, content] of Object.entries(skills)) {
    mkdirSync(join(skillsDir, name), { recursive: true });
    writeFileSync(join(skillsDir, name, "SKILL.md"), content, "utf-8");
  }
}

function cleanCloneDir() {
  try {
    rmSync(join(tmpdir(), "plannar-install"), { recursive: true, force: true });
  } catch {
    // ok
  }
}

describe("install-skills helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    execSpy.mockReset();
    selectMock.mockReset();
    confirmMock.mockReset();
    checkboxMock.mockReset();
    cleanCloneDir();
  });

  it("getAvailableSkills lists skills from repo directory", async () => {
    const tmp = useTempDir("get-skills");
    try {
      const repoDir = join(tmp, "repo");
      createFakeSkillRepo(repoDir, { plannar: "# Test", changesets: "# Test" });
      const { getAvailableSkills } = await import("./install-skills.js");
      const skills = getAvailableSkills(repoDir);
      expect(skills.sort()).toEqual(["changesets", "plannar"]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("getAvailableSkills returns empty array when no skills dir", async () => {
    const tmp = useTempDir("empty");
    try {
      const { getAvailableSkills } = await import("./install-skills.js");
      const skills = getAvailableSkills(tmp);
      expect(skills).toEqual([]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("resolveTargetDir returns .agents/skills for general agent", async () => {
    const { resolveTargetDir } = await import("./install-skills.js");
    expect(resolveTargetDir("local", "general", "/project")).toBe("/project/.agents/skills");
    expect(resolveTargetDir("global", "general", "/project")).toBe(
      join(homedir(), ".agents", "skills"),
    );
  });

  it("resolveTargetDir returns .claude/skills for claude agent", async () => {
    const { resolveTargetDir } = await import("./install-skills.js");
    expect(resolveTargetDir("local", "claude", "/project")).toBe("/project/.claude/skills");
  });

  it("copySkill copies skill to target directory", async () => {
    const tmp = useTempDir("copy");
    try {
      const repoDir = join(tmp, "repo");
      const targetDir = join(tmp, "target");
      createFakeSkillRepo(repoDir, { plannar: "# Test content" });
      const { copySkill } = await import("./install-skills.js");
      const result = copySkill(repoDir, "plannar", targetDir);
      expect(result).toBe(true);
      expect(existsSync(join(targetDir, "plannar", "SKILL.md"))).toBe(true);
      expect(readFileSync(join(targetDir, "plannar", "SKILL.md"), "utf-8")).toBe("# Test content");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("copySkill returns false for unknown skill", async () => {
    const tmp = useTempDir("unknown");
    try {
      const repoDir = join(tmp, "repo");
      const targetDir = join(tmp, "target");
      createFakeSkillRepo(repoDir, {});
      const { copySkill } = await import("./install-skills.js");
      const result = copySkill(repoDir, "nonexistent", targetDir);
      expect(result).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("createSymlink creates symlink from source to link", async () => {
    const tmp = useTempDir("symlink");
    try {
      const sourceDir = join(tmp, ".agents", "skills");
      const linkDir = join(tmp, ".claude", "skills");
      mkdirSync(join(sourceDir, "plannar"), { recursive: true });
      writeFileSync(join(sourceDir, "plannar", "SKILL.md"), "# Test", "utf-8");

      const { createSymlink } = await import("./install-skills.js");
      createSymlink(sourceDir, linkDir, "plannar");

      expect(existsSync(join(linkDir, "plannar"))).toBe(true);
      expect(lstatSync(join(linkDir, "plannar")).isSymbolicLink()).toBe(true);
      expect(readFileSync(join(linkDir, "plannar", "SKILL.md"), "utf-8")).toBe("# Test");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("install-skills command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    execSpy.mockReset();
    selectMock.mockReset();
    confirmMock.mockReset();
    checkboxMock.mockReset();
    cleanCloneDir();
  });

  it("installs specified skill with --local --agent general", async () => {
    const tmp = useTempDir("cmd-local-general");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "general", symlink: false },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs to claude agent directory", async () => {
    const tmp = useTempDir("cmd-local-claude");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "claude", symlink: false },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".claude", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(existsSync(join(tmp, ".agents", "skills", "plannar"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs to both agents with symlink", async () => {
    const tmp = useTempDir("cmd-both-symlink");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "both", symlink: true },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(lstatSync(join(tmp, ".claude", "skills", "plannar")).isSymbolicLink()).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs both agents without symlink (copy)", async () => {
    const tmp = useTempDir("cmd-both-copy");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "both", symlink: false },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(existsSync(join(tmp, ".claude", "skills", "plannar", "SKILL.md"))).toBe(true);
      const claudeStat = lstatSync(join(tmp, ".claude", "skills", "plannar"));
      expect(claudeStat.isSymbolicLink()).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs multiple skills", async () => {
    const tmp = useTempDir("cmd-multi");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) {
          createFakeSkillRepo(match[1], {
            plannar: "# Plannar",
            changesets: "# Changesets",
          });
        }
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "general", symlink: false },
        rawArgs: ["plannar", "changesets"],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(existsSync(join(tmp, ".agents", "skills", "changesets", "SKILL.md"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("errors on unknown skill from args", async () => {
    const tmp = useTempDir("cmd-unknown");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "general", symlink: false },
        rawArgs: ["nonexistent"],
        cmd,
      } as any);

      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects invalid agent value", async () => {
    const tmp = useTempDir("cmd-invalid-agent");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "invalid", symlink: false },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("errors when no skills found in repository", async () => {
    const tmp = useTempDir("cmd-empty-repo");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) mkdirSync(match[1], { recursive: true });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: "general", symlink: false },
        rawArgs: ["plannar"],
        cmd,
      } as any);

      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs all skills when no skill names provided (TTY)", async () => {
    const tmp = useTempDir("cmd-tty-all");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    selectMock.mockResolvedValue("global");
    checkboxMock.mockResolvedValue(["general"]);
    confirmMock.mockResolvedValue(false);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) {
          createFakeSkillRepo(match[1], {
            plannar: "# Plannar",
            changesets: "# Changesets",
          });
        }
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: true, global: false, agent: undefined, symlink: false },
        rawArgs: [],
        cmd,
      } as any);

      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(existsSync(join(tmp, ".agents", "skills", "changesets", "SKILL.md"))).toBe(true);
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, configurable: true });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("uses select and checkbox prompts for location and agents (TTY)", async () => {
    const tmp = useTempDir("cmd-tty-checkbox");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

    selectMock.mockResolvedValue("local");
    checkboxMock.mockResolvedValue(["general", "claude"]);
    confirmMock.mockResolvedValue(true);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) createFakeSkillRepo(match[1], { plannar: "# Plannar" });
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: false, global: false, agent: undefined, symlink: false },
        rawArgs: [],
        cmd,
      } as any);

      expect(selectMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Install location:" }),
      );
      expect(checkboxMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Which agents?" }),
      );
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Symlink from .agents to .claude?" }),
      );
      expect(existsSync(join(tmp, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(lstatSync(join(tmp, ".claude", "skills", "plannar")).isSymbolicLink()).toBe(true);
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, configurable: true });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("installs all skills when no skill names provided (non-TTY)", async () => {
    const tmp = useTempDir("cmd-no-tty-all");
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    execSpy.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("git clone")) {
        const match = cmd.match(/"([^"]+)"/);
        if (match) {
          createFakeSkillRepo(match[1], {
            plannar: "# Plannar",
            changesets: "# Changesets",
          });
        }
      }
    });

    try {
      const { default: cmd } = await import("./install-skills.js");
      await cmd.run!({
        args: { local: false, global: false, agent: undefined, symlink: false },
        rawArgs: [],
        cmd,
      } as any);

      const home = homedir();
      expect(existsSync(join(home, ".agents", "skills", "plannar", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".agents", "skills", "changesets", "SKILL.md"))).toBe(true);

      rmSync(join(home, ".agents", "skills", "plannar"), { recursive: true, force: true });
      rmSync(join(home, ".agents", "skills", "changesets"), { recursive: true, force: true });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
