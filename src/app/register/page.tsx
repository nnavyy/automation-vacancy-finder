"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Create account and trigger 6-digit OTP email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(cleanEmail)) {
      setLoading(false);
      router.push("/");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      // Move to Step 2: Enter 6-digit OTP verification code
      setStep("otp");
      setResendCooldown(60);
    } catch {
      setError("Network error while creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP and sign straight into the dashboard
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      code: code.trim(),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error || "Invalid or expired verification code.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandLogo size={48} className="mb-4 drop-shadow-md" />
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            {BRAND_NAME}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {step === "form"
              ? "Create your account to start automated vacancy finding"
              : "Verify your email address to complete registration"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium leading-relaxed mb-4">
              {error}
            </div>
          )}

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
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
                <label htmlFor="reg-confirm" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors shadow-sm shadow-emerald-950/50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Sending verification code…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT EMAIL OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2.5 mb-1">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-zinc-100">{email.trim().toLowerCase()}</span>.
                  Enter it below to activate your account.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reg-otp" className="block text-xs text-zinc-400 font-medium cursor-pointer">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-otp"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors shadow-sm shadow-emerald-950/50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying & signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setCode("");
                    setError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back to registration details
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
