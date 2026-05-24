import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { defineCommand } from "citty";

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

const samplePlan = `import { Button } from "@/components/ui/button";

# Hello, Plannar!

Welcome to your first plan. Plans are interactive MDX documents with
live components powered by shadcn/ui.

## Try It

Type something below and watch it update in real time:

<Playground>
  <input
    bind="text:'Hello world'"
    placeholder="Type something..."
    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
  />
  <p>You typed: {text}</p>
</Playground>

<Playground>
  <Button bind="count:0" onClick={() => setCount(count + 1)} variant="outline">
    Clicked {count} times
  </Button>
</Playground>

## Next Steps

- Create more plans in \`.plannar/plans/\`
- Run \`plannar editor\` to preview them
- Run \`plannar export <name>\` to export as HTML
`;

function ask(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

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
    deps[pkg] = "*";
  }
  return deps;
}

const SKILL_SOURCE = "ethan-krich/plannar@plannar";

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
    } catch {
      console.log("Setup failed. You can complete it manually:");
      console.log(`  cd ${plannarDir} && npx shadcn@latest add button && npm install`);
    }

    console.log("\nRun 'plannar editor' to preview your plans.");

    if (!process.stdin.isTTY) return;

    const answer = await ask(`\nInstall the plannar agent skill? (${SKILL_SOURCE}) [Y/n] `);

    if (answer && answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
      console.log("Skipped skill installation. Run: npx skills add " + SKILL_SOURCE);
      return;
    }

    console.log("\nInstalling plannar agent skill...\n");
    try {
      execSync(`npx skills add ${SKILL_SOURCE}`, { stdio: "inherit" });
    } catch {
      console.log("Skill installation failed. You can install it manually:");
      console.log("  npx skills add " + SKILL_SOURCE);
    }
  },
});
