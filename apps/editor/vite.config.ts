import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mdxPlugin } from "@plannar/core";

export default defineConfig({
  plugins: [tailwindcss(), react(), mdxPlugin],
});
