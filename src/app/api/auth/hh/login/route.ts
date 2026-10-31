import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { randomBytes } from "node:crypto";

/**
 * GET /api/auth/hh/login
 * Redirects the user to HeadHunter's official OAuth 2.0 authorization screen.
 * Works for 100% of users on any device (laptop, mobile, tablet) without installing anything.
 */
export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.HH_CLIENT_ID;
  if (!clientId) {
    const errorMsg =
      "Official HeadHunter OAuth is not enabled on this public instance. Please connect your account using the Chrome Extension or Session Cookie.";
    const isJson = req.headers.get("accept")?.includes("application/json");
    if (isJson) {
      return NextResponse.json(
        { success: false, error: errorMsg, code: "OAUTH_DISABLED_PUBLIC_INSTANCE" },
        { status: 400 }
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard/settings?oauth_error=" + encodeURIComponent(errorMsg), req.url)
    );
  }

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = new URL("/api/auth/hh/callback", baseUrl).toString();
  const state = randomBytes(32).toString("hex");

  const authUrl = `https://hh.ru/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("hh_oauth_state", `${user.id}:${state}`, {
    httpOnly: true, secure: new URL(baseUrl).protocol === "https:", sameSite: "lax",
    path: "/api/auth/hh", maxAge: 600,
  });
  return response;
}
