// ============================================================
// Nanda AI Job Assistant — Prisma Client Singleton
// ============================================================
// NeonDB free tier puts the compute to sleep after ~5 min idle.
// When the DB wakes up, the first connection attempt often fails
// with "Can't reach database server" or "connection closed".
//
// Solution: wrap all Prisma queries in a retry function that
// automatically retries on transient connection errors (up to 3x).
// ============================================================

import { PrismaClient } from "@prisma/client";

// ── Singleton ─────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ── Retry wrapper for NeonDB cold-start ──────────────────────

const RETRYABLE_ERRORS = [
  "Can't reach database server",
  "Connection refused",
  "connection closed",
  "Connection timed out",
  "ECONNREFUSED",
  "ECONNRESET",
  "socket hang up",
  "Server has closed the connection",
  "Unable to open a connection",
  "Pool timeout",
  "Error { kind: Closed }",
];

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? "";
  return RETRYABLE_ERRORS.some((pattern) => msg.includes(pattern));
}

/**
 * Wraps a Prisma query in a retry loop for NeonDB cold-start tolerance.
 *
 * @param fn       - async function that performs the Prisma query
 * @param retries  - max attempts (default: 3)
 * @param delayMs  - initial delay between retries in ms (doubles each attempt)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 800,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < retries && isTransientError(err)) {
        const wait = delayMs * Math.pow(2, attempt - 1); // 800ms, 1600ms, 3200ms
        console.warn(
          `[DB] Transient error on attempt ${attempt}/${retries}. Retrying in ${wait}ms...`,
          err instanceof Error ? err.message : err,
        );
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export default prisma;
