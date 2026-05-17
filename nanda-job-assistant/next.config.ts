import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API routes for AI analysis
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    // Allow large response bodies for vacancy data
  },
};

export default nextConfig;
