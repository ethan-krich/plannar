import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { defineCommand } from "citty";
import { select, confirm, checkbox } from "@inquirer/prompts";
import {
  cloneRepo,
  getAvailableSkills,
  resolveTargetDir,
  copySkill,
  createSymlink,
  GIT_REMOTE,
} from "./install-skills.js";

const componentsJson = {
  $schema: "https://ui.shadcn.com/schema.json",
  style: "base-nova",
  rsc: false,
  tsx: true,
  tailwind: {
    config: "",
    css: "node_modules/.plannar-junk.css",
    baseColor: "neutral",
    cssVariables: true,
    prefix: "",
  },
  iconLibrary: "lucide",
  rtl: false,
  aliases: {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  },
  menuColor: "default",
  menuAccent: "subtle",
  registries: {},
};

const packageJson = {
  name: "plannar",
  private: true,
  type: "module",
};

const tsconfigJson = {
  compilerOptions: {
    jsx: "react-jsx",
    baseUrl: ".",
    paths: {
      "@/*": ["./*"],
    },
  },
};

const utilsTs = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const KNOWN_VERSIONS: Record<string, string> = {
  clsx: "^2.1.1",
  "tailwind-merge": "^3.6.0",
  "class-variance-authority": "^0.7.1",
  "@base-ui/react": "^1.4.1",
  "lucide-react": "^1.16.0",
  "tw-animate-css": "^1.4.0",
};

function resolveVersion(pkg: string): string {
  if (KNOWN_VERSIONS[pkg]) return KNOWN_VERSIONS[pkg];
  try {
    const v = execSync(`npm view ${pkg} version`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (v) return `^${v}`;
  } catch {
    // fall through
  }
  return "latest";
}

const samplePlan = `import { Button } from "@/components/ui/button";

# Hello, Plannar!

> A worked example of what a real plan looks like. Delete this file
> when you write your first one — or keep it around as a reference.

## Plan: add \`--dry-run\` to \`plannar export\`

Today \`plannar export\` writes HTML to disk immediately. Reviewers
who just want to see *what* would be written — and where — have to
delete the output after the fact.

A \`--dry-run\` flag prints the resolved plan list, output paths,
and total size, then exits without touching the filesystem.

## Behavior

Toggle the flag to see the difference:

<Playground>
  <Button
    bind="dryRun:false"
    onClick={() => setDryRun(!dryRun)}
    variant="outline"
  >
    {dryRun ? "--dry-run ON" : "--dry-run OFF"}
  </Button>

  <pre className="mt-3 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
    {dryRun
      ? \`$ plannar export --dry-run
[dry-run] would write 3 plans:
  .plannar/exports/onboarding.html   (42 KB)
  .plannar/exports/pagination.html   (38 KB)
  .plannar/exports/rate-limit.html   (51 KB)
[dry-run] total: 131 KB — no files written\`
      : \`$ plannar export
✓ wrote .plannar/exports/onboarding.html
✓ wrote .plannar/exports/pagination.html
✓ wrote .plannar/exports/rate-limit.html
3 plans exported (131 KB)\`}
  </pre>
</Playground>

## Edge cases

- **Empty plans directory** — exit 0 with \`no plans found\` (same as today).
- **\`--out\` set to a non-existent dir** — dry-run still validates the path and warns; no \`mkdir\`.
- **A plan fails to compile** — dry-run reports the error and exits non-zero, matching the non-dry path.

## Acceptance

- [ ] \`plannar export --dry-run\` exits 0 and writes nothing
- [ ] Output lists each plan, target path, and byte size
- [ ] Same exit codes as a real export on compile errors
- [ ] Covered by a test in \`packages/plannar/src/commands/export.test.ts\`

## Next steps for you

- Edit this file in \`.plannar/plans/hello-world.mdx\` to draft your own plan
- Run \`plannar editor\` to preview it live with HMR
- Run \`plannar export <name>\` to package it as a single HTML file
`;

function walkDir(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, files);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

export function collectExternalImports(plannarDir: string): string[] {
  const deps = new Set<string>();
  const files = [...walkDir(join(plannarDir, "components")), ...walkDir(join(plannarDir, "lib"))];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const importRe = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRe.exec(content)) !== null) {
      const spec = match[1];
      if (spec.startsWith("@/") || spec.startsWith(".")) continue;
      const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      deps.add(pkg);
    }
  }

  return [...deps];
}

function resolveDeps(plannarDir: string): Record<string, string> {
  const packages = collectExternalImports(plannarDir);

  const existingPkgPath = join(plannarDir, "package.json");
  if (existsSync(existingPkgPath)) {
    const existing = JSON.parse(readFileSync(existingPkgPath, "utf-8"));
    for (const key of Object.keys(existing.dependencies ?? {})) {
      packages.push(key);
    }
  }

  const deps: Record<string, string> = {};
  for (const pkg of [...new Set(packages)].sort()) {
    deps[pkg] = resolveVersion(pkg);
  }
  return deps;
}

export default defineCommand({
  meta: {
    name: "init",
    description: "Initialize .plannar/ directory with shadcn/ui config",
  },
  async run() {
    const cwd = process.cwd();
    const plannarDir = join(cwd, ".plannar");
    const plansDir = join(plannarDir, "plans");
    const nodeModulesDir = join(plannarDir, "node_modules");

    mkdirSync(plansDir, { recursive: true });
    mkdirSync(nodeModulesDir, { recursive: true });

    writeFileSync(
      join(plannarDir, "components.json"),
      JSON.stringify(componentsJson, null, 2) + "\n",
      "utf-8",
    );

    writeFileSync(
      join(plannarDir, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf-8",
    );

    writeFileSync(
      join(plannarDir, "tsconfig.json"),
      JSON.stringify(tsconfigJson, null, 2) + "\n",
      "utf-8",
    );

    mkdirSync(join(plannarDir, "lib"), { recursive: true });
    writeFileSync(join(plannarDir, "lib", "utils.ts"), utilsTs, "utf-8");

    writeFileSync(
      join(nodeModulesDir, ".plannar-junk.css"),
      "/* plannar — styles are managed by the editor, not shadcn */\n",
      "utf-8",
    );

    writeFileSync(join(plansDir, "hello-world.mdx"), samplePlan, "utf-8");

    console.log("✓ Initialized .plannar/");
    console.log("  └── components.json      (shadcn/ui registry)");
    console.log("  └── package.json         (npm package)");
    console.log("  └── tsconfig.json        (TypeScript config)");
    console.log("  └── lib/");
    console.log("       └── utils.ts         (cn utility)");
    console.log("  └── node_modules/");
    console.log("       └── .plannar-junk.css");
    console.log("  └── plans/");
    console.log("       └── hello-world.mdx");
    console.log("\nInstalling shadcn/ui components...\n");

    try {
      execSync("npx shadcn@latest add button", {
        cwd: plannarDir,
        stdio: "inherit",
      });

      const deps = resolveDeps(plannarDir);
      const pkg = { ...packageJson, dependencies: deps };
      writeFileSync(join(plannarDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n", "utf-8");

      console.log("\nInstalling dependencies...\n");
      execSync("npm install", {
        cwd: plannarDir,
        stdio: "inherit",
      });
    } catch (err) {
      const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
      console.error("\nSetup failed:");
      console.error(message);
      console.error("\nYou can complete it manually:");
      console.error(`  cd ${plannarDir} && npx shadcn@latest add button && npm install`);
      process.exitCode = 1;
      return;
    }

    console.log("\nRun 'plannar editor' to preview your plans.");

    if (!process.stdin.isTTY) return;

    const shouldInstall = await confirm({
      message: "Install the plannar agent skill?",
      default: true,
    });

    if (!shouldInstall) {
      console.log("Skipped skill installation. Run: plannar install-skills plannar");
      return;
    }

    console.log("\nFetching latest skills...");
    const tmpDir = join(tmpdir(), "plannar-init");
    let repoDir: string;

    try {
      repoDir = cloneRepo(tmpDir);
    } catch (err) {
      console.error(
        "Failed to clone skills repository:",
        err instanceof Error ? err.message : String(err),
      );
      console.error(`Repository: ${GIT_REMOTE}`);
      console.error("\nYou can install it manually:");
      console.error("  plannar install-skills plannar");
      process.exitCode = 1;
      return;
    }

    const available = getAvailableSkills(repoDir);
    if (!available.includes("plannar")) {
      console.error("Plannar skill not found in repository.");
      rmSync(tmpDir, { recursive: true, force: true });
      process.exitCode = 1;
      return;
    }

    const location = await select<"local" | "global">({
      message: "Install location:",
      choices: [
        { name: "Global (user home)", value: "global" as const },
        { name: "Local (current project)", value: "local" as const },
      ],
    });

    const agents = await checkbox<"general" | "claude">({
      message: "Which agents?",
      choices: [
        { name: "General (.agents)", value: "general" },
        { name: "Claude (.claude)", value: "claude" },
      ],
    });

    if (agents.length === 0) {
      agents.push("general");
    }

    let shouldSymlink = false;
    if (agents.length === 2) {
      shouldSymlink = await confirm({ message: "Symlink from .agents to .claude?" });
    }

    console.log(
      `\nInstalling plannar skill for ${agents.join(" and ")} agent${agents.length > 1 ? "s" : ""} (${location})...\n`,
    );

    if (agents.length === 2) {
      const generalDir = resolveTargetDir(location, "general", cwd);
      const claudeDir = resolveTargetDir(location, "claude", cwd);

      if (copySkill(repoDir, "plannar", generalDir)) {
        if (shouldSymlink) {
          createSymlink(generalDir, claudeDir, "plannar");
        } else {
          copySkill(repoDir, "plannar", claudeDir);
        }
      }
    } else {
      const targetDir = resolveTargetDir(location, agents[0], cwd);
      copySkill(repoDir, "plannar", targetDir);
    }

    rmSync(tmpDir, { recursive: true, force: true });
  },
});
