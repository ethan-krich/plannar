import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin } from "@plannar/core";
import type { BindingMeta } from "@plannar/core";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const shadcnBindings: Record<string, BindingMeta> = {
  input: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  checkbox: {
    valueProp: "checked",
    changeProp: "onCheckedChange",
    extract: "e",
  },
};

export default defineConfig({
  plugins: [tailwindcss(), react(), mdxPlugin({ bindings: shadcnBindings })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
