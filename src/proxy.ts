// src/proxy.ts — Complete Lockdown for Maintenance Mode (Next.js 16+)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, images, icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Lock down all routes (/login, /register, /dashboard, etc.) -> Redirect to '/'
  if (pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export default proxy;
export const middleware = proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
