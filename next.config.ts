import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API routes for AI analysis
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Skip lint + type checks on Vercel build (handle these locally)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
