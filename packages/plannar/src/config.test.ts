import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveConfig } from "./config.js";
import { generateMdx } from "@plannar/core";
import { shadcnBindings } from "@plannar/registry-metadata";

describe("resolveConfig", () => {
  it("derives exportsFolder from an overridden plannarFolder", async () => {
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
      expect(config.globalCss).toBeUndefined();
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

  it("parses meta bindings from config JSON", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          meta: {
            "my-input": {
              valueProp: "value",
              changeProp: "onValueChange",
              extract: "e",
            },
            "my-toggle": {
              valueProp: "pressed",
              changeProp: "onPressedChange",
              extract: "e",
            },
          },
        }),
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      expect(config.meta).toBeDefined();
      expect(config.meta!["my-input"]).toEqual({
        valueProp: "value",
        changeProp: "onValueChange",
        extract: "e",
      });
      expect(config.meta!["my-toggle"]).toEqual({
        valueProp: "pressed",
        changeProp: "onPressedChange",
        extract: "e",
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("meta bindings support inject transform", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          meta: {
            "range-slider": {
              valueProp: "value",
              changeProp: "onValueChange",
              extract: "e[0]",
              inject: "[v]",
            },
          },
        }),
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      expect(config.meta).toBeDefined();
      expect(config.meta!["range-slider"]).toEqual({
        valueProp: "value",
        changeProp: "onValueChange",
        extract: "e[0]",
        inject: "[v]",
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("config meta flows through to generateMdx as custom bindings", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          meta: {
            customslider: {
              valueProp: "value",
              changeProp: "onSlide",
              extract: "e.detail",
              inject: "[v]",
            },
          },
        }),
        "utf-8",
      );

      const plansDir = join(cwd, ".plannar", "plans");
      mkdirSync(plansDir, { recursive: true });
      writeFileSync(
        join(plansDir, "test.mdx"),
        `<Playground>\n  <CustomSlider bind="pos:25" />\n</Playground>`,
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      const result = await generateMdx(join(plansDir, "test.mdx"), {
        bindings: { ...shadcnBindings, ...config.meta },
      });

      expect(result).toContain("onSlide");
      expect(result).toContain("setPos(e.detail)");
      expect(result).toContain("[pos]");
      expect(result).toContain("useState(25)");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("user meta overrides built-in shadcn bindings", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          meta: {
            input: {
              valueProp: "customValue",
              changeProp: "onCustomChange",
              extract: "e.detail",
            },
          },
        }),
        "utf-8",
      );

      const plansDir = join(cwd, ".plannar", "plans");
      mkdirSync(plansDir, { recursive: true });
      writeFileSync(
        join(plansDir, "test.mdx"),
        `<Playground>\n  <input bind="name:'Alice'" />\n</Playground>`,
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      const result = await generateMdx(join(plansDir, "test.mdx"), {
        bindings: { ...shadcnBindings, ...config.meta },
      });

      expect(result).toContain("customValue");
      expect(result).toContain("onCustomChange");
      expect(result).toContain("setName(e.detail)");
      expect(result).not.toContain("e.target.value");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("unregistered component gets bind stripped but state wired", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "plannar-config-test-"));

    try {
      writeFileSync(
        join(cwd, "plannar.config.json"),
        JSON.stringify({
          meta: {
            mybutton: {
              valueProp: "label",
              changeProp: "onPress",
              extract: "e",
            },
          },
        }),
        "utf-8",
      );

      const plansDir = join(cwd, ".plannar", "plans");
      mkdirSync(plansDir, { recursive: true });
      writeFileSync(
        join(plansDir, "test.mdx"),
        `<Playground>\n  <MyButton bind="clicks:0" />\n  <UnknownThing bind="state:5" />\n</Playground>`,
        "utf-8",
      );

      const config = await resolveConfig(cwd);

      const result = await generateMdx(join(plansDir, "test.mdx"), {
        bindings: { ...shadcnBindings, ...config.meta },
      });

      // registered component gets value/change props
      expect(result).toContain("setClicks(e)");
      expect(result).toContain("label:");
      expect(result).toContain("onPress");

      // unregistered component: bind stripped, state still wired
      expect(result).toContain("useState(5)");
      expect(result).toContain("setState");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
