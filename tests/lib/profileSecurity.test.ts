import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), findUser: vi.fn() }));
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: async () => ({ id: "user-1" }) }));
vi.mock("@/lib/db", () => ({ default: { searchPreference: mocks, user: { findUnique: mocks.findUser } } }));
vi.mock("bcryptjs", () => ({ default: { compare: async () => true } }));
vi.mock("@/lib/verificationCode", () => ({ createVerificationCode: async () => "123456", sendVerificationEmail: vi.fn(), isMailConfigured: () => true }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), after: vi.fn() }));
import { POST as profile } from "@/app/api/profiles/route";
import { POST as register } from "@/app/api/register/route";
beforeEach(() => vi.clearAllMocks());

describe("profile security", () => {
  it("returns only profile metadata after renaming, excluding stored credentials", async () => {
    mocks.findFirst.mockResolvedValue({ id: "profile-1" });
    mocks.update.mockResolvedValue({ id: "profile-1", name: "Renamed", isActive: true, hhToken: "secret", aiProviderOrder: { customProviders: {} } });
    const response = await profile(new NextRequest("http://localhost/api/profiles", { method: "POST", body: JSON.stringify({ action: "rename", id: "profile-1", name: "Renamed" }) }));
    const text = await response.text();
    expect(text).not.toContain("hhToken");
    expect(text).not.toContain("aiProviderOrder");
  });

  it("does not let registration overwrite an existing user's preferences before OTP verification", async () => {
    mocks.findUser.mockResolvedValue({ id: "user-1", passwordHash: "hash", name: "Example" });
    const response = await register(new NextRequest("http://localhost/api/register", { method: "POST", body: JSON.stringify({ name: "Example", email: "example@example.com", password: "password123", onboardingProfile: { targetRoles: ["Developer"], requiredSkills: ["TypeScript"] } }) }));
    expect(response.status).toBe(200);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
