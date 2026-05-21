import { defineCommand } from "citty";
import { exportPlan } from "@plannar/export";
import { resolveConfig } from "../config.js";

export default defineCommand({
  meta: {
    name: "export",
    description: "Export a plan to a self-contained HTML file",
  },
  args: {
    plan: {
      type: "positional",
      description: "Plan name (without .mdx extension)",
      required: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const config = await resolveConfig(cwd);

    const outPath = await exportPlan(args.plan, {
      cwd,
      plannarFolder: config.plannarFolder,
      exportsFolder: config.exportsFolder,
      globalCss: config.globalCss,
      cssFilePath: config.cssFilePath,
      viteConfig: config.viteConfig?.exports,
    });

    console.log(`✓ Exported to ${outPath}`);
  },
});
