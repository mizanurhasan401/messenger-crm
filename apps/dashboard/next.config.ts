import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Compile shared workspace packages (shipped as TS source).
  transpilePackages: ["@messenger/ui", "@messenger/shared"],
};

export default nextConfig;
