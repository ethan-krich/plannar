import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
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
    css: "index.css",
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

const defaultConfig = {
  plannarFolder: ".plannar",
  exportsFolder: ".plannar/exports",
  globalCss: ".plannar/index.css",
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
  include: ["**/*.ts", "**/*.tsx"],
};

const indexCss = `@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
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

    mkdirSync(plansDir, { recursive: true });

    writeFileSync(
      join(plannarDir, "components.json"),
      JSON.stringify(componentsJson, null, 2) + "\n",
      "utf-8",
    );

    writeFileSync(
      join(plannarDir, "config.json"),
      JSON.stringify(defaultConfig, null, 2) + "\n",
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

    writeFileSync(join(plannarDir, "index.css"), indexCss, "utf-8");

    writeFileSync(join(plansDir, "hello-world.mdx"), samplePlan, "utf-8");

    console.log("✓ Initialized .plannar/");
    console.log("  └── components.json   (shadcn/ui registry)");
    console.log("  └── config.json        (project config)");
    console.log("  └── index.css           (shadcn theme + overrides)");
    console.log("  └── package.json       (npm package)");
    console.log("  └── tsconfig.json      (TypeScript config)");
    console.log("  └── plans/");
    console.log("       └── hello-world.mdx");
    console.log("\nRun 'plannar editor' to preview your plans.");

    if (!process.stdin.isTTY) return;

    const answer = await ask(`\nInstall the plannar agent skill? (${SKILL_SOURCE}) [Y/n] `);

    if (answer && answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
      console.log("Skipped skill installation. Run: npx skills add " + SKILL_SOURCE + " -g -y");
      return;
    }

    console.log("\nInstalling plannar agent skill...\n");
    try {
      execSync(`npx skills add ${SKILL_SOURCE} -g -y`, { stdio: "inherit" });
    } catch {
      console.log("Skill installation failed. You can install it manually:");
      console.log("  npx skills add " + SKILL_SOURCE + " -g -y");
    }
  },
});
