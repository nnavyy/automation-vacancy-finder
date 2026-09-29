"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: "If an account exists, a reset link has been sent to your email.", type: "success" });
      } else {
        setMsg({ text: data.error || "Failed to send reset link.", type: "error" });
      }
    } catch {
      setMsg({ text: "An error occurred. Please try again.", type: "error" });
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
            <Mail className="text-emerald-400" size={22} />
          </div>

          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Forgot Password</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Enter your email address and we will send you a secure link to reset your password.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {msg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                  msg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {msg.type === "success" ? <CheckCircle size={14} className="shrink-0" /> : null}
                <span>{msg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Sending reset link…</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
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
