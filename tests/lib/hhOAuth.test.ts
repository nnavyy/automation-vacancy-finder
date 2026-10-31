import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: async () => ({ id: "user-1" }) }));
vi.mock("axios", () => ({ default: { post } }));
import { GET as login } from "@/app/api/auth/hh/login/route";
import { GET as callback } from "@/app/api/auth/hh/callback/route";

beforeEach(() => {
  post.mockClear();
  vi.stubEnv("HH_CLIENT_ID", "test-client");
  vi.stubEnv("HH_CLIENT_SECRET", "test-secret");
  vi.stubEnv("APP_BASE_URL", "https://service.example.com");
});

describe("HH OAuth CSRF protection", () => {
  it("issues an unpredictable, browser-bound state and uses the configured origin", async () => {
    const response = await login(new NextRequest("https://service.example.com/api/auth/hh/login", { headers: { "x-forwarded-host": "attacker.example.com" } }));
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("state")).toMatch(/^[a-f0-9]{64}$/);
    expect(location.searchParams.get("redirect_uri")).toBe("https://service.example.com/api/auth/hh/callback");
    expect(response.cookies.get("hh_oauth_state")?.value).toBe(`user-1:${location.searchParams.get("state")}`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects a callback containing only the public user ID as state", async () => {
    const response = await callback(new NextRequest("https://service.example.com/api/auth/hh/callback?code=attacker-code&state=user-1"));
    expect(post).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("Invalid%20OAuth%20state");
  });
});
