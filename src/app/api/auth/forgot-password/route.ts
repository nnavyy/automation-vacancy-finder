import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`forgot-pwd:${ip}`, 3, 15 * 60 * 1000); // 3 attempts per 15m
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many password reset requests. Please wait a while before trying again." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found for security (prevent email enumeration)
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Expires in 1 hour
      },
    });

    // Use req.nextUrl.origin to get the correct absolute URL automatically (works locally and on Vercel)
    const resetLink = `${req.nextUrl.origin}/reset-password/${token}`;

    // Try to send email if GMAIL user and pass are set
    const senderEmail = process.env.EMAIL_USER;
    const senderPass = process.env.EMAIL_PASS;

    if (senderEmail && senderPass) {
      const transporter = nodemailer.createTransport({
        // Use explicit host/port instead of service:"gmail" — more reliable with App Passwords
        host: "smtp.gmail.com",
        port: 465,
        secure: true,  // TLS on port 465
        auth: {
          user: senderEmail,
          pass: senderPass,
        },
      });

      await transporter.sendMail({
        from: `"Nanda AI Job Assistant" <${senderEmail}>`,
        to: user.email,
        subject: "Password Reset Request — Nanda AI Job Assistant",
        html: `
          <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Nanda AI Job Assistant</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">HH.ru Automation Pipeline</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px;">Password Reset Request</h2>
              
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                Hello <strong style="color: #e4e4e7;">${user.name || "there"}</strong>,
              </p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset your password. Click the button below to create a new password. This link is valid for 1 hour.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 24px 0 0; padding: 16px; background: #18181b; border-radius: 8px; border: 1px solid #27272a;">
                <strong style="color: #a1a1aa;">Notice:</strong><br>
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <p style="color: #52525b; font-size: 11px; margin: 16px 0 0; word-break: break-all;">
                Direct link: ${resetLink}
              </p>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 24px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 11px; margin: 0;">
                Nanda AI Job Assistant · HH.ru Vacancy Automation
              </p>
            </div>
          </div>
        `,
      });
      console.log("[ForgotPassword] Email sent to", user.email);
    } else {
      console.warn("[ForgotPassword] EMAIL_USER or EMAIL_PASS not set. Reset link:", resetLink);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the full error so we can debug on Vercel
    console.error("[POST /api/auth/forgot-password] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      command: (error as any)?.command,
    });
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
