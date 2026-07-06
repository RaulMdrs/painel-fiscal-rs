import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os imports de tipos do core vivem fora de packages/web.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
