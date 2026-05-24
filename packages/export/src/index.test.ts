import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach } from "vitest";
import { exportPlan } from "./index.js";

const pkgDir = dirname(fileURLToPath(import.meta.url));

function findNearestNodeModules(startDir: string): string | null {
  let dir = resolve(startDir);
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "node_modules");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function linkNodeModules(plannarDir: string) {
  const nm = findNearestNodeModules(pkgDir);
  if (nm) {
    symlinkSync(nm, join(plannarDir, "node_modules"), "dir");
  }
}

function writeFixtureComponents(plannarDir: string) {
  const libDir = join(plannarDir, "lib");
  mkdirSync(libDir, { recursive: true });
  writeFileSync(
    join(libDir, "utils.ts"),
    [
      "export function cn(...inputs: (string | undefined | false | null)[]) {",
      "  return inputs.filter(Boolean).join(' ');",
      "}",
    ].join("\n"),
    "utf-8",
  );

  const uiDir = join(plannarDir, "components", "ui");
  mkdirSync(uiDir, { recursive: true });
  writeFileSync(
    join(uiDir, "button.tsx"),
    [
      'import { cn } from "@/lib/utils";',
      "",
      "const variants: Record<string, string> = {",
      '  default: "bg-primary text-primary-foreground",',
      '  outline: "border-border bg-background hover:bg-muted",',
      "};",
      "",
      "function Button({",
      "  className,",
      '  variant = "default",',
      "  ...props",
      '}: React.ComponentProps<"button"> & { variant?: string }) {',
      "  return (",
      "    <button",
      "      className={cn(",
      '        "inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-2.5",',
      "        variants[variant],",
      "        className,",
      "      )}",
      "      {...props}",
      "    />",
      "  );",
      "}",
      "",
      "export { Button };",
    ].join("\n"),
    "utf-8",
  );
}

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

    linkNodeModules(plannarDir);

    const plansDir = join(plannarDir, "plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, `${planName}.mdx`), content, "utf-8");

    return dir;
  }

  function setupCwdWithComponents(planName: string, content: string) {
    const dir = mkdtempSync(join(tmpdir(), "plannar-export-test-"));
    tmpDirs.push(dir);

    const plannarDir = join(dir, ".plannar");
    mkdirSync(plannarDir, { recursive: true });

    linkNodeModules(plannarDir);
    writeFixtureComponents(plannarDir);

    const plansDir = join(plannarDir, "plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, `${planName}.mdx`), content, "utf-8");

    return dir;
  }

  function setupCustomPlannarCwd(planName: string, content: string) {
    const dir = mkdtempSync(join(tmpdir(), "plannar-export-test-"));
    tmpDirs.push(dir);

    const plannarDir = join(dir, ".plans");
    mkdirSync(plannarDir, { recursive: true });

    linkNodeModules(plannarDir);

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
    const cwd = setupCwdWithComponents(
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

    linkNodeModules(plannarDir);

    const plansDir = join(plannarDir, "plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, "foo.mdx"), "# Foo\n", "utf-8");

    const outPath = await exportPlan("foo", { cwd });
    expect(outPath).toContain(".plannar/exports/foo.html");
  });

  it("skips missing derived global CSS for custom plannar folders", async () => {
    const cwd = setupCustomPlannarCwd(
      "styled",
      '<div className="bg-fuchsia-500 text-white p-4 rounded-xl">Tailwind proof</div>',
    );

    const outPath = await exportPlan("styled", {
      cwd,
      plannarFolder: ".plans",
      exportsFolder: ".plans/exports",
      globalCss: ".plans/globals.css",
    });
    const html = readFileSync(outPath, "utf-8");

    expect(html).toContain("Tailwind proof");
    expect(html).toContain(".bg-fuchsia-500");
    expect(html).not.toContain("process.env.NODE_ENV");
    expect(outPath).toContain(".plans/exports/styled.html");
  });
});
