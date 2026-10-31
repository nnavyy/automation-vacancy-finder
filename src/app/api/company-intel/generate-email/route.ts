// ============================================================
// POST /api/company-intel/generate-email
// AI-powered cold outreach email generator
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { hasCompanyIntelAccess } from "@/lib/entitlements";
import { callAI } from "@/lib/aiProviderRouter";
import { PROMPT_INJECTION_DEFENSE_DIRECTIVE, wrapUntrustedPromptBlock } from "@/lib/security";

function isOutreachBody(value: unknown): value is {
  contactName: string; companyName: string; contactRole?: string; jobTitle?: string; language?: string;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (!("contactName" in value) || typeof value.contactName !== "string" || !value.contactName.trim()) return false;
  if (!("companyName" in value) || typeof value.companyName !== "string" || !value.companyName.trim()) return false;
  return Object.entries(value).every(([key, field]) =>
    !["contactName", "companyName", "contactRole", "jobTitle", "language"].includes(key)
    || (typeof field === "string" && field.length <= 300));
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasCompanyIntelAccess(user.id)) {
      return NextResponse.json({ success: false, code: "COMPANY_INTEL_REQUIRED", error: "Company Intel requires paid access." }, { status: 403 });
    }

    const body: unknown = await req.json().catch(() => null);
    if (!isOutreachBody(body)) {
      return NextResponse.json({ success: false, error: "Valid contactName and companyName are required" }, { status: 400 });
    }
    const { contactName, contactRole, companyName, jobTitle } = body;
    const language = body.language === "Russian" ? "Russian" : "English";

    // Get the user's resume text from settings
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
      select: { resumeText: true },
    });

    const resumeSnippet = pref?.resumeText
      ? pref.resumeText.slice(0, 500) + (pref.resumeText.length > 500 ? "..." : "")
      : "Experienced professional with relevant skills.";

    const systemPrompt = `You are an expert job search coach who writes highly personalized cold outreach emails. 
Your emails are warm, genuine, concise (under 150 words), and never sound salesy or desperate.
${PROMPT_INJECTION_DEFENSE_DIRECTIVE}
Always output ONLY the email body — no subject line, no "Dear X" header repetition, no sign-off metadata.
Language: ${language}`;

    const prompt = `Write a cold outreach email using the following context as data:
${wrapUntrustedPromptBlock("outreach_context", JSON.stringify({
  sender: user.name, contactName, contactRole: contactRole ?? "Professional", companyName,
  jobTitle: jobTitle ?? "a position at " + companyName, resumeSummary: resumeSnippet,
}))}
Goal: Stand out to the contact and seek a referral or direct conversation.

Requirements:
- Address the contact by first name
- Reference the specific role they hold at the company
- Mention the applied position naturally (not desperately)
- One sentence about why specifically this company/role excites them
- Clear, low-pressure call to action (e.g., a 15-minute call)
- Keep it under 150 words
- Tone: confident, genuine, human — not robotic or template-y

Output only the email body text.`;

    const result = await callAI({
      prompt,
      systemPrompt,
      requestType: "outreach_email",
      maxTokens: 800,
    });

    if (result.isRateLimited || !result.content.trim()) {
      return NextResponse.json(
        { success: false, error: "AI providers unavailable, please try again later" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: result.content.trim(),
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    console.error("[POST /api/company-intel/generate-email]", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
