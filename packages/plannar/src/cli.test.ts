import { describe, it, expect } from "vitest";

describe("plannar commands", () => {
  it("init command can be imported", async () => {
    const mod = await import("./commands/init.js");
    expect(mod.default).toBeDefined();
  });

  it("editor command can be imported", async () => {
    const mod = await import("./commands/editor.js");
    expect(mod.default).toBeDefined();
  });

  it("export command can be imported", async () => {
    const mod = await import("./commands/export.js");
    expect(mod.default).toBeDefined();
  });

  it("status command can be imported", async () => {
    const mod = await import("./commands/status.js");
    expect(mod.default).toBeDefined();
  });

  it("install-skills command can be imported", async () => {
    const mod = await import("./commands/install-skills.js");
    expect(mod.default).toBeDefined();
  });
});
