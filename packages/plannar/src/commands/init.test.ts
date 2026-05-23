import { describe, it, expect, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function useTempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `plannar-init-${label}-`));
}

describe("init command", () => {
  it("creates the expected files in .plannar/", async () => {
    const tmp = useTempDir("creates-files");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);

    try {
      const { default: initCmd } = await import("./init.js");
      const meta = (initCmd as { meta: { name: string } }).meta;
      expect(meta.name).toBe("init");

      // Run the command
      const runFn = (initCmd as { run: () => Promise<void> }).run;
      await runFn();

      const plannarDir = join(tmp, ".plannar");

      // Verify files exist
      expect(existsSync(join(plannarDir, "components.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "config.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "index.css"))).toBe(true);
      expect(existsSync(join(plannarDir, "package.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "tsconfig.json"))).toBe(true);
      expect(existsSync(join(plannarDir, "plans", "hello-world.mdx"))).toBe(true);

      // Verify package.json content
      const pkg = JSON.parse(readFileSync(join(plannarDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("plannar");
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");

      // Verify tsconfig.json content
      const tsconfig = JSON.parse(readFileSync(join(plannarDir, "tsconfig.json"), "utf-8"));
      expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");
      expect(tsconfig.compilerOptions.baseUrl).toBe(".");
      expect(tsconfig.compilerOptions.paths).toEqual({ "@/*": ["./*"] });

      // Verify config.json includes globalCss pointing to index.css
      const config = JSON.parse(readFileSync(join(plannarDir, "config.json"), "utf-8"));
      expect(config.plannarFolder).toBe(".plannar");
      expect(config.exportsFolder).toBe(".plannar/exports");
      expect(config.globalCss).toBe(".plannar/index.css");

      // Verify index.css content
      const css = readFileSync(join(plannarDir, "index.css"), "utf-8");
      expect(css).toContain('@import "tailwindcss"');
      expect(css).toContain("--background: oklch(1 0 0)");
      expect(css).toContain("@theme inline");

      // Verify hello-world.mdx content
      const mdx = readFileSync(join(plannarDir, "plans", "hello-world.mdx"), "utf-8");
      expect(mdx).toContain("# Hello, Plannar!");
      expect(mdx).toContain("plannar editor");
      expect(mdx).toContain("plannar export");
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
