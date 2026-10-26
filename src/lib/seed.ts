// ============================================================
// Nanda AI Job Assistant — Database Seeder
// ============================================================
// Seeds a default SearchPreference record if none exists.
// Safe to run multiple times — idempotent.
//
// Run with:
//   npm run db:seed
//   (i.e.  tsx src/lib/seed.ts)
// ============================================================

// Use a relative import here because this file is executed directly
// by tsx (not bundled by Next.js), and tsx resolves @/ aliases via
// the tsconfig.json paths — this explicit relative path is a safe fallback.
import prisma from "./db";

// ── Seed Data ─────────────────────────────────────────────────

/**
 * Seeds a default SearchPreference if the database has no preferences yet.
 * NOTE: In the multi-user architecture, preferences are per-User.
 *       This seeder only runs as a one-time dev helper and targets
 *       the first existing user, or prints a notice if no users exist yet.
 */
async function seed(): Promise<void> {
  console.log("Starting database seed for Nanda AI Job Assistant...");
  console.log("  Database:", process.env.DATABASE_URL ? "(connected)" : "DATABASE_URL not set!");

  // ── Check for existing user ──────────────────────────────
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!firstUser) {
    console.log("No users found in the database.");
    console.log("  Please register an account via the web app first, then re-run the seeder.");
    return;
  }

  console.log(`Found user: ${firstUser.email} (id: ${firstUser.id})`);

  // ── SearchPreference ────────────────────────────────────
  const existingPref = await prisma.searchPreference.findFirst({
    where: { userId: firstUser.id, name: "Default" },
  });

  if (existingPref) {
    console.log("Default SearchPreference already exists — skipping.");
  } else {
    await prisma.searchPreference.create({
      data: {
        userId: firstUser.id,
        name: "Default",
        isActive: true,

        // Target job roles
        targetRoles: [
          "Frontend Developer",
          "Junior Frontend Developer",
          "Full-stack Developer",
          "UI/UX Designer",
          "Web Designer",
          "WordPress Developer",
          "AI Chatbot Developer",
        ],

        // English search keywords for HH API
        searchKeywordsEn: [
          "frontend developer",
          "junior frontend",
          "react developer",
          "next.js developer",
          "typescript developer",
          "web designer",
          "ui ux designer",
          "figma designer",
          "wordpress developer",
          "ai chatbot developer",
        ],

        // Russian search keywords for HH API
        searchKeywordsRu: [
          "фронтенд разработчик",
          "junior frontend разработчик",
          "стажер frontend",
          "react разработчик",
          "веб-дизайнер",
          "чат-бот разработчик",
          "удаленно frontend",
        ],

        // Must-have skills
        requiredSkills: [
          "React",
          "TypeScript",
          "Next.js",
        ],

        // Nice-to-have skills
        niceToHaveSkills: [
          "Figma",
          "WordPress",
          "Tailwind CSS",
          "Node.js",
          "PostgreSQL",
        ],

        // HH experience IDs
        experience: [
          "noExperience",
          "between1And3",
        ],

        // Work format preferences
        workFormat: [
          "remote",
          "hybrid",
        ],

        salaryMinimum: null,

        // Auto-disqualify keywords
        excludeKeywords: [
          "senior",
          "lead",
          "5+ years",
          "требуется опыт от 5",
          "только офис",
          "relocation not provided",
        ],

        // Red flag keywords
        redFlagKeywords: [
          "паспорт",
          "залог",
          "оплата обучения",
          "без оплаты",
          "только telegram",
          "гражданство рф",
        ],

        minimumScoreToNotify: 65,
        maxNotificationsPerDay: 15,

        aiProviderOrder: [
          "groq",
          "gemini",
          "openrouter",
        ],
      },
    });
    console.log("Created Default SearchPreference for user:", firstUser.email);
  }

  console.log("");
  console.log("Database seed complete!");
  console.log("  You can now run: npm run dev");
}

// ── Entry Point ───────────────────────────────────────────────

seed()
  .catch((error: unknown) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("  Prisma client disconnected.");
  });
