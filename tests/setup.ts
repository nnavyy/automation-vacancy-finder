import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  if (typeof document !== "undefined") cleanup();
});

process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests";
(process.env as Record<string, string | undefined>).NODE_ENV =
  process.env.NODE_ENV ?? "test";

// Prisma client is never touched in unit tests.
vi.mock("@/lib/db", () => ({
  default: {},
  withRetry: async <T,>(fn: () => Promise<T>) => fn(),
}));
