#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "plannar",
    version: "0.0.0",
    description: "MDX plan editor CLI — init, preview, and export plans",
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    editor: () => import("./commands/editor.js").then((m) => m.default),
    export: () => import("./commands/export.js").then((m) => m.default),
    status: () => import("./commands/status.js").then((m) => m.default),
  },
});

void runMain(main);
