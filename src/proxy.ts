// src/proxy.ts — Protect /dashboard routes (Next.js 16+)
import { auth } from "@/lib/auth";

// Next.js 16 requires a "proxy" named export or default export
export default auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
