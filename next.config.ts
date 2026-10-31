import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API routes for AI analysis
  serverExternalPackages: ["@prisma/client", "prisma"],

};

export default nextConfig;
