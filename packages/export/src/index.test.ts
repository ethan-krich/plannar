import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach } from "vitest";
import { exportPlan } from "./index.js";

const _dir = dirname(fileURLToPath(import.meta.url));
const rootPlannar = join(_dir, "..", "..", "..", ".plannar");

describe("exportPlan", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function setupCwd(planName: string, content: string) {
    const dir = mkdtempSync(join(tmpdir(), "plannar-export-test-"));
    tmpDirs.push(dir);

    const plannarDir = join(dir, ".plannar");
    mkdirSync(plannarDir, { recursive: true });

    cpSync(join(rootPlannar, "components"), join(plannarDir, "components"), { recursive: true });
    cpSync(join(rootPlannar, "lib"), join(plannarDir, "lib"), { recursive: true });
    symlinkSync(rootPlannar + "/node_modules", join(plannarDir, "node_modules"), "dir");

    const plansDir = join(plannarDir, "plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, `${planName}.mdx`), content, "utf-8");

    return dir;
  }

  it("exports a basic plan to a self-contained HTML file", async () => {
    const cwd = setupCwd("hello", "# Hello\n\nThis is a test plan.\n");

    const outPath = await exportPlan("hello", { cwd });

    const html = readFileSync(outPath, "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Hello");
    expect(html).toContain("createRoot");
    expect(html).toContain("mdx-content");
    expect(html).toContain("--background");
    expect(html).not.toContain("unpkg.com");
    expect(html).not.toContain("importmap");
    expect(html).not.toContain("esm.sh");
    expect(outPath).toContain(".plannar/exports/hello.html");
  });

  it("includes styles used by generated shadcn components", async () => {
    const cwd = setupCwd(
      "button",
      [
        'import { Button } from "@/components/ui/button";',
        "",
        "# Button",
        "",
        '<Button variant="outline">Export me</Button>',
        "",
      ].join("\n"),
    );

    const outPath = await exportPlan("button", { cwd });
    const html = readFileSync(outPath, "utf-8");

    expect(html).toContain("Export me");
    expect(html).toContain(".inline-flex");
    expect(html).toContain(".border-border");
    expect(html).toContain(".hover\\:bg-muted");
    expect(html).toContain(".mdx-content");
  });

  it("creates the exports directory if it does not exist", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-export-test-"));
    tmpDirs.push(cwd);

    const plannarDir = join(cwd, ".plannar");
    mkdirSync(plannarDir, { recursive: true });

    cpSync(join(rootPlannar, "components"), join(plannarDir, "components"), { recursive: true });
    cpSync(join(rootPlannar, "lib"), join(plannarDir, "lib"), { recursive: true });
    symlinkSync(rootPlannar + "/node_modules", join(plannarDir, "node_modules"), "dir");

    const plansDir = join(plannarDir, "plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, "foo.mdx"), "# Foo\n", "utf-8");

    const outPath = await exportPlan("foo", { cwd });
    expect(outPath).toContain(".plannar/exports/foo.html");
  });
});
