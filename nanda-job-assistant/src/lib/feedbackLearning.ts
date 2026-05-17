// ============================================================
// Nanda AI Job Assistant — Feedback Learning
// ============================================================
// Retrieves and stores user feedback so the AI can learn from
// Nanda's past apply/skip decisions and personalise future scores.
//
// The retrieved examples are injected directly into the AI prompt,
// giving it concrete examples of what Nanda liked and disliked.
// ============================================================

import type { NormalizedVacancy, SimilarFeedbackExample } from "@/types";
import prisma from "@/lib/db";

// ── Helpers ───────────────────────────────────────────────────

/** Common English stop-words to strip from title keyword extraction */
const STOP_WORDS = new Set([
  "and", "or", "the", "a", "an", "for", "in", "at", "to", "of",
  "is", "are", "be", "was", "were", "has", "have", "on", "with",
  "by", "as", "this", "that", "its", "it", "not", "but",
]);

/**
 * Extracts meaningful keywords from a vacancy title for similarity matching.
 * Lowercases, strips punctuation, and removes short/stop words.
 *
 * @param title - Raw vacancy title string
 * @returns Array of lowercase keywords (length >= 3, not stop-words)
 */
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[\s,/|()\-–]+/)                         // split on whitespace and common separators
    .map((word) => word.replace(/[^a-zа-я0-9.#+]/g, "")) // strip special chars
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

// ── Public Functions ──────────────────────────────────────────

/**
 * Retrieves similar past feedback examples to inject into the AI prompt.
 *
 * Algorithm:
 *  1. Extract keywords from the current vacancy title
 *  2. Fetch the 200 most recent feedback entries (with vacancy + analysis data)
 *  3. Score each feedback by keyword overlap with the current vacancy title
 *  4. Sort by overlap descending
 *  5. Return top 5 positive (apply/save/interview) and top 5 negative (skip) examples
 *
 * Fails silently — returns empty arrays if DB query fails or no feedback exists.
 *
 * @param vacancy - The vacancy currently being analysed
 * @returns Positive and negative SimilarFeedbackExample arrays
 */
export async function getSimilarFeedbackExamples(
  vacancy: NormalizedVacancy
): Promise<{
  positive: SimilarFeedbackExample[];
  negative: SimilarFeedbackExample[];
}> {
  try {
    const currentKeywords = extractKeywords(vacancy.title);

    // Nothing to match against — skip the DB query
    if (currentKeywords.length === 0) {
      return { positive: [], negative: [] };
    }

    // Fetch recent feedback with their associated vacancy and AI analysis
    const recentFeedbacks = await prisma.vacancyFeedback.findMany({
      include: {
        vacancy: {
          include: {
            // Join analysis so we can surface matchScore and summary in examples
            analysis: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      // Fetch a generous window and filter in-memory for relevance
      take: 200,
    });

    // Score each feedback by keyword overlap with the current vacancy title
    const scored = recentFeedbacks
      .map((fb) => {
        const fbKeywords = extractKeywords(fb.vacancy.title);
        // Count how many current keywords appear in the feedback vacancy's keywords
        const overlap = currentKeywords.filter(
          (kw) =>
            fbKeywords.includes(kw) ||
            fb.vacancy.title.toLowerCase().includes(kw)
        ).length;
        return { fb, overlap };
      })
      .filter((s) => s.overlap > 0)              // keep only relevant entries
      .sort((a, b) => b.overlap - a.overlap);    // most similar first

    // Build positive examples (Nanda chose to apply / save / interview)
    const positive: SimilarFeedbackExample[] = scored
      .filter((s) =>
        ["apply", "save", "interview"].includes(s.fb.userAction)
      )
      .slice(0, 5)
      .map((s) => ({
        title: s.fb.vacancy.title,
        company: s.fb.vacancy.company ?? undefined,
        userAction: s.fb.userAction,
        matchScore: s.fb.vacancy.analysis?.matchScore ?? undefined,
        summary: s.fb.vacancy.analysis?.summary ?? undefined,
      }));

    // Build negative examples (Nanda decided to skip)
    const negative: SimilarFeedbackExample[] = scored
      .filter((s) => s.fb.userAction === "skip")
      .slice(0, 5)
      .map((s) => ({
        title: s.fb.vacancy.title,
        company: s.fb.vacancy.company ?? undefined,
        userAction: s.fb.userAction,
        matchScore: s.fb.vacancy.analysis?.matchScore ?? undefined,
        summary: s.fb.vacancy.analysis?.summary ?? undefined,
      }));

    return { positive, negative };
  } catch (error) {
    console.error("[FeedbackLearning] Failed to retrieve feedback examples:", error);
    // Return empty arrays — the AI will proceed without personalisation
    return { positive: [], negative: [] };
  }
}

/**
 * Saves user feedback for a vacancy.
 *
 * Actions performed atomically (in sequence, not in a transaction to keep
 * the code simple — all three are idempotent enough for our use case):
 *  1. Creates a VacancyFeedback row with the action and optional reason
 *  2. Appends an immutable ApplicationLog entry for auditing
 *  3. Updates the Vacancy.status field to reflect the new state
 *
 * Supported userAction values:
 *   "apply"     → status: applied_manual
 *   "skip"      → status: skipped
 *   "save"      → status: saved
 *   "interview" → status: applied_manual
 *   "rejected"  → status: ignored
 *
 * Fails silently — errors are logged but do not propagate.
 *
 * @param vacancyId - Internal Prisma ID of the Vacancy record
 * @param userAction - The action Nanda took on this vacancy
 * @param reason    - Optional free-text reason (especially useful for "skip")
 */
export async function saveFeedback(
  vacancyId: string,
  userAction: string,
  reason?: string
): Promise<void> {
  try {
    // 1. Persist the feedback entry
    await prisma.vacancyFeedback.create({
      data: {
        vacancyId,
        userAction,
        userReason: reason,
      },
    });

    // 2. Write an immutable audit log entry
    await prisma.applicationLog.create({
      data: {
        vacancyId,
        action: userAction,
        notes: reason,
      },
    });

    // 3. Map user action to the corresponding vacancy status
    const statusMap: Record<string, string> = {
      apply:     "applied_manual",
      skip:      "skipped",
      save:      "saved",
      interview: "applied_manual",
      rejected:  "ignored",
    };
    const newStatus = statusMap[userAction] ?? "notified";

    await prisma.vacancy.update({
      where: { id: vacancyId },
      data: { status: newStatus },
    });

    console.log(
      `[FeedbackLearning] Saved feedback "${userAction}" for vacancy ${vacancyId}.`
    );
  } catch (error) {
    console.error(
      `[FeedbackLearning] Failed to save feedback for vacancy ${vacancyId}:`,
      error
    );
    // Swallow — a feedback write failure must not crash the calling flow
  }
}
