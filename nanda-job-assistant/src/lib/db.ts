// ============================================================
// Nanda AI Job Assistant — Prisma Client Singleton
// ============================================================
// Next.js hot-module replacement (HMR) in development creates
// new module instances on every file change, which would cause
// "Too many Prisma Client instances" warnings.
// Solution: attach the client to globalThis so it survives HMR.
// ============================================================

import { PrismaClient } from "@prisma/client";

// Extend globalThis with a typed prisma slot
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client singleton.
 *
 * - Development: reuses the instance stored on globalThis across HMR cycles.
 * - Production:  always creates a fresh client (globalThis is not reused).
 *
 * Usage:
 *   import prisma from "@/lib/db";
 *   const users = await prisma.userProfile.findMany();
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Persist the client on globalThis in non-production environments
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
