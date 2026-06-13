import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  lstatSync,
  cpSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir, homedir } from "node:os";
import { defineCommand } from "citty";
import { select, confirm, checkbox } from "@inquirer/prompts";

export const GIT_REMOTE = "https://github.com/ethan-krich/plannar";

export function cloneRepo(workDir: string): string {
  const repoDir = join(workDir, "plannar-repo");
  if (existsSync(repoDir)) {
    rmSync(repoDir, { recursive: true, force: true });
  }
  mkdirSync(workDir, { recursive: true });
  execSync(`git clone --depth 1 ${GIT_REMOTE} "${repoDir}"`, {
    stdio: ["ignore", "pipe", "pipe"],
  });
  return repoDir;
}

export function getAvailableSkills(repoDir: string): string[] {
  const skillsDir = join(repoDir, "skills");
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir).filter((d) => {
    const full = join(skillsDir, d);
    if (!statSync(full).isDirectory()) return false;
    return existsSync(join(full, "SKILL.md"));
  });
}

export function resolveTargetDir(
  location: "local" | "global",
  agent: "general" | "claude",
  cwd: string,
): string {
  const base = location === "global" ? homedir() : cwd;
  const dir = agent === "claude" ? ".claude" : ".agents";
  return join(base, dir, "skills");
}

export function copySkill(repoDir: string, skillName: string, targetDir: string): boolean {
  const source = join(repoDir, "skills", skillName);
  const dest = join(targetDir, skillName);

  if (!existsSync(source)) {
    console.error(`  ✗ Skill "${skillName}" not found in repository`);
    return false;
  }

  if (existsSync(dest)) {
    try {
      if (lstatSync(dest).isSymbolicLink()) {
        rmSync(dest, { recursive: true, force: true });
      }
    } catch {
      // lstatSync can throw, just force remove
    }
    rmSync(dest, { recursive: true, force: true });
  }

  mkdirSync(targetDir, { recursive: true });
  cpSync(source, dest, { recursive: true });
  console.log(`  ✓ Installed ${skillName} to ${dest}`);
  return true;
}

export function createSymlink(sourceDir: string, linkDir: string, skillName: string): void {
  const linkPath = join(linkDir, skillName);
  const sourcePath = join(sourceDir, skillName);

  if (existsSync(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true });
  }

  mkdirSync(linkDir, { recursive: true });
  symlinkSync(sourcePath, linkPath, "dir");
  console.log(`  ✓ Symlinked ${skillName} from .agents/ → .claude/`);
}

export default defineCommand({
  meta: {
    name: "install-skills",
    description: "Install plannar agent skills into .agents or .claude directories",
  },
  args: {
    local: {
      type: "boolean",
      description: "Install in the current project",
      default: false,
    },
    global: {
      type: "boolean",
      description: "Install globally in user home directory",
      default: false,
    },
    agent: {
      type: "string",
      description: "Agent type: general (.agents), claude (.claude), or both",
    },
    symlink: {
      type: "boolean",
      description: "Symlink skills from .agents to .claude when installing to both",
      default: false,
    },
  },
  async run({ args, rawArgs }) {
    const cwd = process.cwd();
    const isTTY = process.stdin.isTTY;

    const skillNames = rawArgs.filter((a) => !a.startsWith("-"));

    console.log("Fetching latest skills...");
    const tmpDir = join(tmpdir(), "plannar-install");
    let repoDir: string;

    try {
      repoDir = cloneRepo(tmpDir);
    } catch (err) {
      console.error(
        "Failed to clone skills repository:",
        err instanceof Error ? err.message : String(err),
      );
      console.error(`Repository: ${GIT_REMOTE}`);
      process.exitCode = 1;
      return;
    }

    const available = getAvailableSkills(repoDir);
    if (available.length === 0) {
      console.error("No skills found in repository.");
      rmSync(tmpDir, { recursive: true, force: true });
      process.exitCode = 1;
      return;
    }

    let selected: string[];

    if (skillNames.length > 0) {
      const invalid = skillNames.filter((n) => !available.includes(n));
      if (invalid.length > 0) {
        console.error(`Unknown skill(s): ${invalid.join(", ")}`);
        console.error(`Available: ${available.join(", ")}`);
        rmSync(tmpDir, { recursive: true, force: true });
        process.exitCode = 1;
        return;
      }
      selected = skillNames;
    } else {
      selected = [...available];
    }

    if (selected.length === 0) {
      console.log("No skills selected.");
      rmSync(tmpDir, { recursive: true, force: true });
      return;
    }

    let location: "local" | "global";
    if (args.local) {
      location = "local";
    } else if (args.global) {
      location = "global";
    } else if (isTTY) {
      location = await select({
        message: "Install location:",
        choices: [
          { name: "Global (user home)", value: "global" as const },
          { name: "Local (current project)", value: "local" as const },
        ],
      });
    } else {
      location = "global";
    }

    let agents: ("general" | "claude")[];

    if (args.agent) {
      const raw = args.agent.toLowerCase();
      if (raw === "both") {
        agents = ["general", "claude"];
      } else if (raw === "general" || raw === "claude") {
        agents = [raw];
      } else {
        console.error(`Invalid agent "${args.agent}". Must be general, claude, or both.`);
        rmSync(tmpDir, { recursive: true, force: true });
        process.exitCode = 1;
        return;
      }
    } else if (isTTY) {
      agents = await checkbox({
        message: "Which agents?",
        choices: [
          { name: "General (.agents)", value: "general" },
          { name: "Claude (.claude)", value: "claude" },
        ],
      });
      if (agents.length === 0) {
        agents = ["general"];
      }
    } else {
      agents = ["general"];
    }

    let shouldSymlink = args.symlink;
    if (agents.length === 2 && !shouldSymlink && isTTY) {
      shouldSymlink = await confirm({ message: "Symlink from .agents to .claude?" });
    }

    console.log(
      `\nInstalling skills for ${agents.join(" and ")} agent${agents.length > 1 ? "s" : ""} (${location})...\n`,
    );

    if (agents.length === 2) {
      const generalDir = resolveTargetDir(location, "general", cwd);
      const claudeDir = resolveTargetDir(location, "claude", cwd);

      for (const skill of selected) {
        copySkill(repoDir, skill, generalDir);
        if (shouldSymlink) {
          createSymlink(generalDir, claudeDir, skill);
        } else {
          copySkill(repoDir, skill, claudeDir);
        }
      }
    } else {
      const targetDir = resolveTargetDir(location, agents[0], cwd);
      for (const skill of selected) {
        copySkill(repoDir, skill, targetDir);
      }
    }

    console.log("\nDone.");

    rmSync(tmpDir, { recursive: true, force: true });
  },
});
