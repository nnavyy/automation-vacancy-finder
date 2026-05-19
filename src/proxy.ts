// src/proxy.ts — Protect /dashboard routes (Next.js 16+)
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
