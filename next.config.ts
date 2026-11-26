import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API routes for AI analysis
  serverExternalPackages: ["@prisma/client", "prisma"],
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/landing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
