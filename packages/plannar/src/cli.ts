#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const main = defineCommand({
  meta: {
    name: "plannar",
    version: "1.0.0",
    description: "MDX plan editor CLI — init, preview, and export plans",
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    editor: () => import("./commands/editor.js").then((m) => m.default),
    export: () => import("./commands/export.js").then((m) => m.default),
    status: () => import("./commands/status.js").then((m) => m.default),
    inspect: () => import("./commands/inspect.js").then((m) => m.default),
    "install-skills": () => import("./commands/install-skills.js").then((m) => m.default),
  },
});

const cwd = process.cwd();
const junkCss = join(cwd, ".plannar", "node_modules", ".plannar-junk.css");
if (existsSync(junkCss)) rmSync(junkCss);

void runMain(main);
