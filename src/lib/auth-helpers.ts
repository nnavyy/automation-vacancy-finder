// ============================================================
// Auth Helpers — Server-side session utilities
// ============================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Gets the current session and redirects to /login if not authenticated.
 * Use in Server Components and API routes.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; email: string; name: string };
}

/**
 * Gets the current user ID from session, or returns null.
 * Use when auth is optional.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
