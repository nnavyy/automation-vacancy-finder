import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  findMany: vi.fn().mockResolvedValue([]),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  launchBrowser: vi.fn().mockResolvedValue({ success: false }),
}));
vi.mock("@/lib/hhBrowserLogin", () => ({ performBrowserLogin: mocks.launchBrowser }));
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: mocks.user }));
vi.mock("@/lib/db", () => ({
  default: {
    companyIntel: { findMany: mocks.findMany },
    verificationCode: { findFirst: mocks.findFirst, update: mocks.update, updateMany: mocks.updateMany },
  },
  withRetry: async <T,>(fn: () => Promise<T>): Promise<T> => fn(),
}));

import { POST as webhook } from "@/app/api/telegram/webhook/route";
import { GET as setupWebhook } from "@/app/api/telegram/setup-webhook/route";
import { GET as companyIntel } from "@/app/api/company-intel/route";
import { POST as companySearch } from "@/app/api/company-intel/search/route";
import { POST as outreach } from "@/app/api/company-intel/generate-email/route";
import { POST as testAI } from "@/app/api/settings/test-ai/route";
import { POST as browserLogin } from "@/app/api/settings/hh-browser-login/route";
import { hashVerificationCode, verifySubmittedCode } from "@/lib/verificationCode";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "test-webhook-secret");
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  vi.stubEnv("COMPANY_INTEL_USER_IDS", "paid-user");
  mocks.user.mockResolvedValue({ id: "free-user", email: "free@example.com" });
});

describe("SaaS security boundaries", () => {
  it("rejects Telegram updates with a missing secret header", async () => {
    const response = await webhook(new NextRequest("http://localhost/api/telegram/webhook", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("fails closed when the Telegram webhook secret is not configured", async () => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "");
    const response = await webhook(new NextRequest("http://localhost/api/telegram/webhook", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("does not let an ordinary account change the shared bot configuration", async () => {
    const response = await setupWebhook(new NextRequest("http://localhost/api/telegram/setup-webhook"));
    expect(response.status).toBe(401);
  });

  it("blocks free accounts before querying Company Intel", async () => {
    const response = await companyIntel();
    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("allows server-granted Company Intel access", async () => {
    mocks.user.mockResolvedValue({ id: "paid-user" });
    const response = await companyIntel();
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "paid-user" } }));
  });

  it("blocks free accounts from both search and AI outreach", async () => {
    const request = (): NextRequest => new NextRequest("http://localhost/api/company-intel/search", { method: "POST", body: "{}" });
    expect((await companySearch(request())).status).toBe(403);
    expect((await outreach(request())).status).toBe(403);
  });

  it("rejects malformed outreach input before querying data or using AI", async () => {
    mocks.user.mockResolvedValue({ id: "paid-user" });
    const response = await outreach(new NextRequest("http://localhost/api/company-intel/generate-email", {
      method: "POST", body: JSON.stringify({ contactName: {}, companyName: "Example" }),
    }));
    expect(response.status).toBe(400);
  });

  it("disables customer-supplied AI connection tests", async () => {
    const response = await testAI();
    expect(response.status).toBe(410);
  });

  it("does not let SaaS customers launch an interactive browser on the operator's host", async () => {
    const response = await browserLogin();
    expect(response.status).toBe(410);
    expect(mocks.launchBrowser).not.toHaveBeenCalled();
  });

  it("does not accept a code already consumed by a concurrent request", async () => {
    mocks.findFirst.mockResolvedValue({ id: "otp", code: hashVerificationCode("user@example.com", "123456"), attempts: 0, expiresAt: new Date(Date.now() + 60_000) });
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const result = await verifySubmittedCode("user@example.com", "123456", "sign_in");
    expect(result.success).toBe(false);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "otp", usedAt: null, attempts: { lt: 5 } }),
    }));
  });
});
