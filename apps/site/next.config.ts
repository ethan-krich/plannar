import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages so Next can consume them in dev.
  transpilePackages: ["@plannar/core", "@plannar/registry-metadata"],
  output: "export",
};

export default withMDX(config);
