import { describe, it, expect, vi, afterEach } from "vitest";
import { generateNumericOTP, hashVerificationCode, isMailConfigured } from "@/lib/verificationCode";

describe("verificationCode helper", () => {
  it("generates a 6-digit numeric OTP", () => {
    const code = generateNumericOTP();
    expect(code).toBeDefined();
    expect(code).toMatch(/^[0-9]{6}$/);
    expect(code.length).toBe(6);
  });

  it("generates different randomized codes", () => {
    const code1 = generateNumericOTP();
    const code2 = generateNumericOTP();
    const code3 = generateNumericOTP();
    const set = new Set([code1, code2, code3]);
    expect(set.size).toBeGreaterThan(1);
  });

  it("hashes OTP code into consistent 64-character hex hash", () => {
    const hash1 = hashVerificationCode("user@example.com", "123456");
    const hash2 = hashVerificationCode("user@example.com", "123456");
    const hashDiffCode = hashVerificationCode("user@example.com", "654321");
    const hashDiffEmail = hashVerificationCode("other@example.com", "123456");

    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiffCode);
    expect(hash1).not.toBe(hashDiffEmail);
  });
});

afterEach(() => vi.unstubAllEnvs());
it("does not use legacy personal credentials as the OTP sender", () => {
  vi.stubEnv("SMTP_USER", ""); vi.stubEnv("SMTP_PASS", "");
  vi.stubEnv("EMAIL_USER", "personal@gmail.com"); vi.stubEnv("EMAIL_PASS", "secret");
  vi.stubEnv("MAIL_FROM_ADDRESS", "");
  expect(isMailConfigured()).toBe(false);
});
it("requires an explicit sender with dedicated SMTP credentials", () => {
  vi.stubEnv("SMTP_USER", "project@gmail.com"); vi.stubEnv("SMTP_PASS", "secret");
  vi.stubEnv("MAIL_FROM_ADDRESS", "project@gmail.com");
  expect(isMailConfigured()).toBe(true);
});
