// ============================================================
// POST /api/company-intel/generate-email
// AI-powered cold outreach email generator
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { callAI } from "@/lib/aiProviderRouter";

export async function POST(req: NextRequest) {
  const user = await requireUser();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      contactName,
      contactRole,
      companyName,
      jobTitle,
      language = "English",
    } = body as {
      contactName?: string;
      contactRole?: string;
      companyName?: string;
      jobTitle?: string;
      language?: string;
    };

    if (!contactName || !companyName) {
      return NextResponse.json(
        { success: false, error: "contactName and companyName are required" },
        { status: 400 }
      );
    }

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
The sender is ${user.name}.
Always output ONLY the email body — no subject line, no "Dear X" header repetition, no sign-off metadata.
Language: ${language}`;

    const prompt = `Write a cold outreach email from ${user.name} to ${contactName} (${contactRole ?? "Professional"} at ${companyName}).
Context:
- The sender just applied for: ${jobTitle ?? "a position at " + companyName}
- Resume summary: ${resumeSnippet}
- Goal: Get on ${contactName}'s radar, stand out from the hundreds of applicants, and ideally get a referral or direct conversation.

Requirements:
- Address ${contactName} by first name
- Reference the specific role they hold at ${companyName}
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
      maxTokens: 400,
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
