import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for production
  output: "standalone",

  // Transpile workspace packages
  transpilePackages: ["@pkp/spec", "@pkp/shared", "@pkp/static-generator"],
};

export default nextConfig;
