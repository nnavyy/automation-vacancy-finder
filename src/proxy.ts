// src/proxy.ts — Route Access & Maintenance Controller (Next.js 16+)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ============================================================
// MAINTENANCE LOCKDOWN TOGGLE (TAHAP TESTING):
// Set ke `true`  -> Redirect semua rute web ke '/' (Under Construction)
// Set ke `false` -> Aktifkan kembali login normal & proteksi /dashboard
// ============================================================
export const IS_MAINTENANCE_LOCKDOWN = true;

const proxyHandler = auth((req) => {
  const { pathname, search } = req.nextUrl;

  // Izinkan asset internal Next.js, static files, favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Jika sedang maintenance mode: arahkan semua rute selain '/' ke '/'
  if (IS_MAINTENANCE_LOCKDOWN) {
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // ============================================================
  // LOGIKA NORMAL AUTH & DASHBOARD DI BAWAH INI TETAP 100% UTUH:
  // ============================================================
  const isLoggedIn = !!req.auth?.user;
  const isProtectedPath = pathname.startsWith("/dashboard");

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    const callback = pathname + search;
    if (callback && callback !== "/") {
      signInUrl.searchParams.set("callbackUrl", callback);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Redirect user yang sudah login dari halaman auth ke /dashboard
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
