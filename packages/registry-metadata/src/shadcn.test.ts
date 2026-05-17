import { describe, it, expect } from "vitest";
import { shadcnBindings } from "./shadcn.js";

describe("shadcnBindings", () => {
  it("covers all interactive shadcn form components", () => {
    expect(shadcnBindings).toHaveProperty("input");
    expect(shadcnBindings).toHaveProperty("textarea");
    expect(shadcnBindings).toHaveProperty("checkbox");
    expect(shadcnBindings).toHaveProperty("switch");
    expect(shadcnBindings).toHaveProperty("toggle");
    expect(shadcnBindings).toHaveProperty("slider");
    expect(shadcnBindings).toHaveProperty("select");
    expect(shadcnBindings).toHaveProperty("radio-group");
    expect(shadcnBindings).toHaveProperty("tabs");
    expect(shadcnBindings).toHaveProperty("accordion");
    expect(shadcnBindings).toHaveProperty("native-select");
  });

  it("covers open/close interactive components", () => {
    expect(shadcnBindings).toHaveProperty("dialog");
    expect(shadcnBindings).toHaveProperty("alert-dialog");
    expect(shadcnBindings).toHaveProperty("sheet");
    expect(shadcnBindings).toHaveProperty("drawer");
    expect(shadcnBindings).toHaveProperty("popover");
    expect(shadcnBindings).toHaveProperty("hover-card");
    expect(shadcnBindings).toHaveProperty("tooltip");
    expect(shadcnBindings).toHaveProperty("dropdown-menu");
    expect(shadcnBindings).toHaveProperty("context-menu");
    expect(shadcnBindings).toHaveProperty("collapsible");
  });

  it("every entry has required BindingMeta fields", () => {
    for (const [name, meta] of Object.entries(shadcnBindings)) {
      expect(meta, `${name} missing valueProp`).toHaveProperty("valueProp");
      expect(typeof meta.valueProp, `${name} valueProp not string`).toBe("string");
      expect(meta, `${name} missing changeProp`).toHaveProperty("changeProp");
      expect(typeof meta.changeProp, `${name} changeProp not string`).toBe("string");
      expect(meta, `${name} missing extract`).toHaveProperty("extract");
      expect(typeof meta.extract, `${name} extract not string`).toBe("string");
    }
  });

  it("input:checkbox and input:number have typed variants", () => {
    expect(shadcnBindings).toHaveProperty("input:checkbox");
    expect(shadcnBindings["input:checkbox"].extract).toBe("e.target.checked");
    expect(shadcnBindings).toHaveProperty("input:number");
    expect(shadcnBindings["input:number"].extract).toBe("e.target.valueAsNumber");
  });

  it("slider has inject for number[] → number transform", () => {
    expect(shadcnBindings.slider.valueProp).toBe("value");
    expect(shadcnBindings.slider.extract).toBe("e[0]");
    expect(shadcnBindings.slider.inject).toBe("[v]");
  });

  it("all keys are lowercase registry names", () => {
    for (const key of Object.keys(shadcnBindings)) {
      expect(key).toBe(key.toLowerCase());
      expect(key).not.toContain(" ");
    }
  });
});
