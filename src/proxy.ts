// src/proxy.ts — Protect /dashboard routes (Next.js 16+)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const proxyHandler = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname, search } = req.nextUrl;

  const isProtectedPath = pathname.startsWith("/dashboard");

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    const callback = pathname + search;
    if (callback && callback !== "/") {
      signInUrl.searchParams.set("callbackUrl", callback);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from public auth pages
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
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};

