"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If not a whitelisted account during maintenance, silently redirect to Under Construction
    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(email)) {
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

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign in after register
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created but sign in failed. Please log in manually.");
      router.push("/login");
    } else {
      router.push("/dashboard");
      router.refresh();
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
            Create your account to start automated vacancy finding
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium">
                {error}
              </div>
            )}

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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                />
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
                  type="password"
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
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
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
