import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { getApiUser } from "@/lib/auth-helpers";

/**
 * GET /api/auth/hh/callback
 * HeadHunter redirects here after the user clicks "Allow" on hh.ru.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/hh/callback`;

    if (error || !code) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?oauth_error=${encodeURIComponent(
            errorDescription || error || "Authorization cancelled by user."
          )}`,
          baseUrl
        )
      );
    }

    const user = await getApiUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", baseUrl));
    }

    const clientId = process.env.HH_CLIENT_ID;
    const clientSecret = process.env.HH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?oauth_error=${encodeURIComponent("OAuth configuration is incomplete.")}`, baseUrl)
      );
    }

    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams();
    tokenParams.append("grant_type", "authorization_code");
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("redirect_uri", redirectUri);
    tokenParams.append("code", code);

    const tokenRes = await axios.post("https://hh.ru/oauth/token", tokenParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (tokenRes.status !== 200 || !tokenRes.data?.access_token) {
      console.error("[HH OAuth] Token exchange error:", tokenRes.data);
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?oauth_error=${encodeURIComponent(
            tokenRes.data?.error_description || "Failed to exchange authorization token with HeadHunter."
          )}`,
          baseUrl
        )
      );
    }

    const accessToken = tokenRes.data.access_token;
    const expiresInSec = tokenRes.data.expires_in || 1209600; // ~14 days default
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    // Fetch user profile from api.hh.ru
    let profileName = null;
    try {
      const meRes = await axios.get("https://api.hh.ru/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": process.env.HH_USER_AGENT || "HHJobCopilot/1.0",
        },
        timeout: 10000,
        validateStatus: () => true,
      });
      if (meRes.status === 200 && meRes.data) {
        profileName = `${meRes.data.first_name || ""} ${meRes.data.last_name || ""}`.trim() || null;
      }
    } catch {}

    // Fetch user resumes
    let resumeId = null;
    let resumeTitle = null;
    try {
      const resumesRes = await axios.get("https://api.hh.ru/resumes/mine", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": process.env.HH_USER_AGENT || "HHJobCopilot/1.0",
        },
        timeout: 10000,
        validateStatus: () => true,
      });
      if (resumesRes.status === 200 && Array.isArray(resumesRes.data?.items) && resumesRes.data.items.length > 0) {
        resumeId = resumesRes.data.items[0].id;
        resumeTitle = resumesRes.data.items[0].title;
      }
    } catch {}

    // Upsert preference
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (pref) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhToken: encrypt(accessToken),
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date(),
          hhExpiresAt: expiresAt,
          hhProfileName: profileName || pref.hhProfileName,
          ...(resumeId && !pref.hhResumeId ? { hhResumeId: resumeId, hhResumeTitle: resumeTitle } : {}),
        },
      });
    }

    return NextResponse.redirect(new URL("/dashboard/settings?oauth_success=true", baseUrl));
  } catch (error: any) {
    console.error("[GET /api/auth/hh/callback]", error);
    return NextResponse.redirect(new URL("/dashboard/settings?oauth_error=" + encodeURIComponent(error.message), req.url));
  }
}
