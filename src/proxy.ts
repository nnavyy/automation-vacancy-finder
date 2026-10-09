// src/proxy.ts — Route Access & Maintenance Controller (Next.js 16+)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

const proxyHandler = auth((req) => {
  const { pathname, search } = req.nextUrl;

  // Allow internal Next.js assets, static files, favicon, screenshots
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const userEmail = req.auth?.user?.email?.toLowerCase();
  const isLoggedIn = !!req.auth?.user;
  const isWhitelisted = isEmailWhitelisted(userEmail);

  // ============================================================
  // MAINTENANCE LOCKDOWN WITH WHITELIST BYPASS
  // ============================================================
  if (IS_MAINTENANCE_LOCKDOWN) {
    // 1. Whitelisted user already authenticated -> FULL BYPASS
    if (isLoggedIn && isWhitelisted) {
      const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password";
      if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
      }
      return NextResponse.next();
    }

    // 2. Allow auth routes so authorized testers can log in/register
    const isAuthRoute =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname.startsWith("/api/auth") ||
      pathname === "/api/register";

    if (isAuthRoute) {
      return NextResponse.next();
    }

    // 3. Unauthorized or anonymous visitors trying to access other pages -> Redirect to '/' (Under Construction)
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // ============================================================
  // NORMAL AUTH & DASHBOARD ROUTING (When Maintenance is Disabled)
  // ============================================================
  const isProtectedPath = pathname.startsWith("/dashboard");

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    const callback = pathname + search;
    if (callback && callback !== "/") {
      signInUrl.searchParams.set("callbackUrl", callback);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages to /dashboard
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export default proxyHandler;
export const proxy = proxyHandler;
export const middleware = proxyHandler;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
