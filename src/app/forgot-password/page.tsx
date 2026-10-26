"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request 6-digit verification code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(cleanEmail)) {
      setLoading(false);
      window.location.href = "/";
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep("verify");
        setResendCooldown(60);
        setMsg({ text: "Verification code sent! Please check your inbox.", type: "success" });
      } else {
        setMsg({ text: data.error || "Failed to send verification code.", type: "error" });
      }
    } catch {
      setMsg({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code & reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (code.trim().length !== 6) {
      setMsg({ text: "Please enter the 6-digit verification code.", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({ text: "Password must be at least 8 characters.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMsg({ text: "Password updated successfully! Redirecting to login...", type: "success" });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setMsg({ text: data.error || "Failed to reset password.", type: "error" });
      }
    } catch {
      setMsg({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        setMsg({ text: "New verification code sent to your email.", type: "success" });
      } else {
        setMsg({ text: data.error || "Failed to resend code.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to resend code. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-sm">
            {step === "request" ? (
              <Mail className="text-emerald-400" size={22} />
            ) : (
              <KeyRound className="text-emerald-400" size={22} />
            )}
          </div>

          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            {step === "request" ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            {step === "request"
              ? "Enter your email address and we will send you a 6-digit verification code."
              : `Enter the 6-digit code sent to ${email} and choose your new password.`}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          {msg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border mb-4 ${
                msg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {msg.type === "success" && <CheckCircle size={14} className="shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {step === "request" ? (
            /* STEP 1: REQUEST CODE */
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-zinc-400 mb-1.5 cursor-pointer">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Sending code…</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY CODE & SET NEW PASSWORD */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reset-code" className="block text-xs font-medium text-zinc-400 cursor-pointer">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reset-code"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                    placeholder="123456"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-zinc-400 mb-1.5 cursor-pointer">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-zinc-400 mb-1.5 cursor-pointer">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6 || !newPassword}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Updating password…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Remember your password?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
