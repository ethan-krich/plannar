import { defineCommand } from "citty";
import { exportPlan } from "@plannar/export";

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
    const outPath = await exportPlan(args.plan, process.cwd());
    console.log(`✓ Exported to ${outPath}`);
  },
});
