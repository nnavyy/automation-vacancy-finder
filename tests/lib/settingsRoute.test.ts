import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: async () => ({ id: "user-1" }) }));
vi.mock("@/lib/catalog/dynamic", () => ({ recordPreferenceCatalogTerms: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { searchPreference: mocks } }));
import { POST } from "@/app/api/settings/route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/settings", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => { vi.clearAllMocks(); mocks.findFirst.mockResolvedValue({ id: "profile-1" }); });

describe("settings API validation", () => {
  it.each([null, [], { minimumScoreToNotify: 200 }, { maxNotificationsPerDay: -1 }, { targetRoles: [123] }, { salaryMinimum: 1.5 }])("rejects invalid preferences: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects an attempt to configure AI providers", async () => {
    const response = await POST(request({ aiCustomConfig: { customProviders: { custom: { baseUrl: "http://127.0.0.1" } } } }));
    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not silently update the active profile when the requested profile is missing", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const response = await POST(request({ id: "another-users-profile", name: "Changed" }));
    expect(response.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not serialize stored HH tokens or legacy AI credentials", async () => {
    mocks.update.mockResolvedValue({ id: "profile-1", hhToken: "secret-session", aiProviderOrder: { customProviders: { groq: { apiKey: "secret-ai-key" } } }, targetRoles: ["Developer"] });
    const response = await POST(request({ name: "Updated" }));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain("secret-session");
    expect(text).not.toContain("secret-ai-key");
    expect(text).not.toContain("customProviders");
  });
});
