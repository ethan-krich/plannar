import { defineCommand } from "citty";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const componentsJson = {
  $schema: "https://ui.shadcn.com/schema.json",
  style: "base-nova",
  rsc: false,
  tsx: true,
  tailwind: {
    config: "",
    css: "src/index.css",
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

    writeFileSync(join(plannarDir, "config.json"), "{}\n", "utf-8");

    writeFileSync(join(plansDir, "hello-world.mdx"), samplePlan, "utf-8");

    console.log("✓ Initialized .plannar/");
    console.log("  └── components.json   (shadcn/ui registry)");
    console.log("  └── config.json        (project config)");
    console.log("  └── plans/");
    console.log("       └── hello-world.mdx");
    console.log("\nRun 'plannar editor' to preview your plans.");
  },
});
