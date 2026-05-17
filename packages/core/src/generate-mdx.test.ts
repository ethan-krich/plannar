import { describe, it, expect } from "vitest";
import { generateMdx } from "./generate-mdx.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function withTempFile(
  content: string,
  fn: (filepath: string) => Promise<void>,
): Promise<void> {
  const dir = join(tmpdir(), `plannar-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, "test.mdx");
  await writeFile(filepath, content);
  try {
    await fn(filepath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("generateMdx", () => {
  it("compiles basic MDX", async () => {
    await withTempFile("# Hello\n\nWorld", async (filepath) => {
      const result = await generateMdx(filepath);
      expect(result).toContain("_jsx");
      expect(result).toContain("Hello");
    });
  });

  it("supports GFM tables", async () => {
    await withTempFile("| a | b |\n| - | - |\n| 1 | 2 |", async (filepath) => {
      const result = await generateMdx(filepath);
      expect(result).toContain("table");
    });
  });

  it("supports code highlighting", async () => {
    await withTempFile("```ts\nconst x = 1;\n```", async (filepath) => {
      const result = await generateMdx(filepath);
      expect(result).toContain("code");
    });
  });

  it("transforms Playground with bind to stateful component", async () => {
    await withTempFile(
      `<Playground>\n  <input bind="text:'hello'" />\n  <p>{text}</p>\n</Playground>`,
      async (filepath) => {
        const result = await generateMdx(filepath);
        expect(result).toContain("_PlannarPlayground_0");
        expect(result).toContain("useState");
        expect(result).toContain("text");
        expect(result).toContain("setText");
      },
    );
  });

  it("transforms bind without initial value to undefined", async () => {
    await withTempFile(`<Playground>\n  <input bind="name" />\n</Playground>`, async (filepath) => {
      const result = await generateMdx(filepath);
      expect(result).toContain("useState(undefined)");
    });
  });

  it("throws on duplicate bind names", async () => {
    await withTempFile(
      `<Playground>\n  <input bind="x:1" />\n  <input bind="x:2" />\n</Playground>`,
      async (filepath) => {
        await expect(generateMdx(filepath)).rejects.toThrow("Duplicate bind names");
      },
    );
  });

  it("handles nested Playgrounds", async () => {
    await withTempFile(
      `<Playground>\n  <Playground>\n    <input bind="inner:1" />\n  </Playground>\n</Playground>`,
      async (filepath) => {
        const result = await generateMdx(filepath);
        expect(result).toContain("_PlannarPlayground_0");
        expect(result).toContain("_PlannarPlayground_1");
      },
    );
  });

  it("forwards MDX options", async () => {
    await withTempFile("# Hello", async (filepath) => {
      const result = await generateMdx(filepath, {
        development: true,
      });
      expect(result).toBeDefined();
    });
  });
});
