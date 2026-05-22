import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveConfig } from "./config.js";

describe("resolveConfig", () => {
  it("derives exportsFolder and globalCss from an overridden plannarFolder", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({ plannarFolder: ".custom-plannar" }),
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      expect(config.plannarFolder).toBe(".custom-plannar");
      expect(config.exportsFolder).toBe(".custom-plannar/exports");
      expect(config.globalCss).toBe(".custom-plannar/globals.css");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("preserves an explicit globalCss override", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          plannarFolder: ".custom-plannar",
          globalCss: "styles/brand.css",
        }),
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      expect(config.globalCss).toBe("styles/brand.css");
      expect(config.exportsFolder).toBe(".custom-plannar/exports");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
