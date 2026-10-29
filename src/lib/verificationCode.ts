// src/lib/verificationCode.ts
// Verification Code (OTP) & Email Delivery Service

import prisma from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { BRAND_NAME } from "@/lib/brand";

export type CodePurpose = "sign_in" | "reset_password" | "register";

// Generate a secure 6-digit numeric code
export function generateNumericOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes a salted HMAC-SHA256 hash of the verification code for secure database storage.
 */
export function hashVerificationCode(email: string, code: string): string {
  const pepper =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "hh-copilot-otp-salt";
  return crypto
    .createHmac("sha256", pepper)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("hex");
}

// Mailer transport instance with connection pooling and IPv4 enforcement
// (prevents 30-40s IPv6 DNS/socket hang on serverless environments)
let cachedTransporter: nodemailer.Transporter | null = null;
let cachedMailerKey = "";

export function isMailConfigured(): boolean {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  return Boolean(user && pass);
}

function getMailer() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  const key = `${host}:${port}:${secure}:${user}`;
  if (cachedTransporter && cachedMailerKey === key) {
    return cachedTransporter;
  }

  cachedMailerKey = key;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    family: 4,
    auth: { user, pass },
  } as nodemailer.TransportOptions);

  return cachedTransporter;
}

// Create & store a new verification code
export async function createVerificationCode(
  email: string,
  purpose: CodePurpose,
  expiryMinutes = 10
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  // Invalidate previous active codes for this email + purpose
  await prisma.verificationCode.updateMany({
    where: {
      email: normalizedEmail,
      purpose,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const rawCode = generateNumericOTP();
  const hashedCode = hashVerificationCode(normalizedEmail, rawCode);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      email: normalizedEmail,
      code: hashedCode,
      purpose,
      expiresAt,
    },
  });

  return rawCode;
}

// Verify a submitted OTP code
export async function verifySubmittedCode(
  email: string,
  code: string,
  purpose: CodePurpose
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const submittedHash = hashVerificationCode(normalizedEmail, cleanCode);

  const record = await prisma.verificationCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { success: false, error: "No active verification code found. Please request a new one." };
  }

  // Check brute-force attempts
  if (record.attempts >= 5) {
    return {
      success: false,
      error: "Too many failed attempts. This code has been invalidated. Please request a new one.",
    };
  }

  // Check expiration
  if (new Date() > record.expiresAt) {
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  // Check matching code: backward-compatible support for legacy plaintext codes (length <= 6)
  const isMatch = record.code.length <= 6
    ? record.code === cleanCode
    : record.code === submittedHash;

  if (!isMatch) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = 5 - (record.attempts + 1);
    return {
      success: false,
      error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`,
    };
  }

  // Mark code as used
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}

// Send beautiful branded email with OTP
export async function sendVerificationEmail({
  email,
  code,
  purpose,
  name,
}: {
  email: string;
  code: string;
  purpose: CodePurpose;
  name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const transporter = getMailer();
  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Mail Dev] EMAIL_USER or EMAIL_PASS not configured. Code for testing:", code);
    } else {
      console.error("[Mail] SMTP is not configured on the server. Email delivery aborted.");
    }
    return { success: false, error: "Email service is not configured on the server." };
  }

  const senderEmail = process.env.SMTP_USER || process.env.EMAIL_USER;

  let title = "Verification Code";
  let description = "Use the 6-digit code below to complete your action.";

  if (purpose === "sign_in") {
    title = "Sign-In Verification Code";
    description = "Someone (hopefully you) is signing in to your account. Enter this verification code to proceed:";
  } else if (purpose === "reset_password") {
    title = "Password Reset Code";
    description = "We received a request to reset your password. Use the verification code below to set a new password:";
  } else if (purpose === "register") {
    title = "Email Verification Code";
    description = "Thank you for registering. Confirm your email address with the code below:";
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #090b0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #12151b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <!-- Top Banner -->
              <tr>
                <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #1f242d;">
                  <div style="display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 20px; font-size: 12px; font-weight: 600; color: #34d399; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${BRAND_NAME}
                  </div>
                  <h1 style="margin: 18px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 32px;">
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                    Hello ${name ? `<strong>${name}</strong>` : "there"},
                  </p>
                  <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                    ${description}
                  </p>

                  <!-- OTP Code Display Box -->
                  <div style="background-color: #090b0e; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; display: inline-block; padding-left: 8px;">
                      ${code}
                    </span>
                    <p style="margin: 12px 0 0 0; font-size: 12px; color: #71717a;">
                      Valid for <strong>10 minutes</strong>. Do not share this code with anyone.
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71717a;">
                    If you did not request this verification code, please ignore this email or review your account security settings.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 32px; background-color: #0c0e13; border-top: 1px solid #1f242d; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #52525b;">
                    © 2026 ${BRAND_NAME}. Autonomous AI Job Search Copilot.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${senderEmail}>`,
      to: email,
      subject: `[${code}] ${title} — ${BRAND_NAME}`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[Mail] Failed to send verification email:", err);
    return { success: false, error: err?.message || "Failed to deliver email" };
  }
}
