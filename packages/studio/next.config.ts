import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for production
  output: "standalone",

  // Transpile workspace packages
  transpilePackages: ["@pkprotocol/spec", "@pkprotocol/shared", "@pkprotocol/static-generator"],
};

export default nextConfig;
