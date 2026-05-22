import { describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  injectTailwindSource,
  isSafePlanSlug,
  resolvePlanPath,
} from "../../../apps/editor/vite.shared.ts";

describe("isSafePlanSlug", () => {
  it("accepts nested lowercase slugs", () => {
    expect(isSafePlanSlug("foo/bar-baz_qux")).toBe(true);
  });

  it("rejects traversal and malformed slugs", () => {
    expect(isSafePlanSlug("../secret")).toBe(false);
    expect(isSafePlanSlug("foo/../secret")).toBe(false);
    expect(isSafePlanSlug("/absolute")).toBe(false);
    expect(isSafePlanSlug("foo\\bar")).toBe(false);
    expect(isSafePlanSlug("foo//bar")).toBe(false);
    expect(isSafePlanSlug("Foo")).toBe(false);
  });
});

describe("resolvePlanPath", () => {
  it("returns a plan path for safe slugs only", () => {
    const plansDir = "/tmp/plans";

    expect(resolvePlanPath(plansDir, "foo/bar")).toBe(join(plansDir, "foo/bar.mdx"));
    expect(resolvePlanPath(plansDir, "../secret")).toBeNull();
    expect(resolvePlanPath(plansDir, "foo/../secret")).toBeNull();
  });
});

describe("injectTailwindSource", () => {
  it("adds the configured plannar folder after the tailwind import", () => {
    const css = '@import "tailwindcss";\n@import "tw-animate-css";';

    expect(injectTailwindSource(css, "/tmp/plannar-e2e/.plans")).toContain(
      '@import "tailwindcss";\n@source "/tmp/plannar-e2e/.plans";',
    );
  });

  it("does not duplicate the source directive", () => {
    const css = '@import "tailwindcss";\n@source "/tmp/plannar-e2e/.plans";';

    expect(injectTailwindSource(css, "/tmp/plannar-e2e/.plans")).toBe(css);
  });
});
