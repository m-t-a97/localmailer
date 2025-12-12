import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  reactCompiler: true,
  transpilePackages: ["@repo/data-commons"],
};

export default nextConfig;
