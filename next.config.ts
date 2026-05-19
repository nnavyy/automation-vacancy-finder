import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API routes for AI analysis
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Skip type checks on Vercel build (handle locally)
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
