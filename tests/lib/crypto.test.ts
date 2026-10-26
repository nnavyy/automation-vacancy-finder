import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

describe("crypto helpers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    (process.env as Record<string, string | undefined>).ENCRYPTION_KEY = "test-secret-key-32-chars-long-for-test!!";
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("encrypts and decrypts text correctly using AES-256-GCM", () => {
    const sensitiveToken = "hh-secret-bearer-token-1234567890";
    const encrypted = encrypt(sensitiveToken);

    expect(encrypted.startsWith("enc:")).toBe(true);
    expect(encrypted).not.toContain(sensitiveToken);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(sensitiveToken);
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("returns raw string if not encrypted with enc: prefix (backwards compatibility)", () => {
    const legacyPlain = "plain-text-token";
    expect(decrypt(legacyPlain)).toBe(legacyPlain);
  });

  it("returns empty string when decryption fails due to corrupted payload", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const corrupted = "enc:aabb:ccdd:11223344";
    expect(decrypt(corrupted)).toBe("");
    spy.mockRestore();
  });

  it("throws fatal error in production if ENCRYPTION_KEY and NEXTAUTH_SECRET are unset", () => {
    delete (process.env as Record<string, string | undefined>).ENCRYPTION_KEY;
    delete (process.env as Record<string, string | undefined>).NEXTAUTH_SECRET;
    delete (process.env as Record<string, string | undefined>).AUTH_SECRET;
    delete (process.env as Record<string, string | undefined>).DATABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    expect(() => encrypt("secret")).toThrow("FATAL: ENCRYPTION_KEY must be set");
  });
});
