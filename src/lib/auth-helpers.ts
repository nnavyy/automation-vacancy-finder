// ============================================================
// Auth Helpers — Server-side session & ownership utilities
// ============================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

/**
 * Gets the current session and redirects to /login if not authenticated.
 * Use in Server Components and Pages.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; email: string; name: string };
}

/**
 * Gets the current user from session for API routes.
 * Returns null if not authenticated (allowing clean 401 response).
 */
export async function getApiUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; email?: string | null; name?: string | null };
}

/**
 * Gets the current user ID from session, or returns null.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Finds a vacancy only if it belongs to the given user (P0-1 IDOR guard).
 */
export async function getOwnedVacancy(vacancyId: string, userId: string) {
  return prisma.vacancy.findFirst({
    where: {
      id: vacancyId,
      userId,
    },
    include: {
      analysis: true,
    },
  });
}

