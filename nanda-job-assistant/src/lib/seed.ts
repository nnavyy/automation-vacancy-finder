// ============================================================
// Nanda AI Job Assistant — Database Seeder
// ============================================================
// Seeds the NeonDB database with Nanda's default UserProfile
// and SearchPreference records on first run.
//
// Safe to run multiple times — checks for existing records
// before creating new ones (idempotent).
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
 * Seeds Nanda's user profile and default search preferences.
 *
 * Behaviour:
 *   - If a UserProfile already exists, skips creation.
 *   - If a SearchPreference named "Default" already exists, skips creation.
 *   - Logs progress to stdout so the seeder can be monitored in CI/CD pipelines.
 */
async function seed(): Promise<void> {
  console.log("🌱 Starting database seed for Nanda AI Job Assistant…");
  console.log("   Database:", process.env.DATABASE_URL ? "(connected)" : "⚠️  DATABASE_URL not set!");

  // ── UserProfile ─────────────────────────────────────────

  const existingProfile = await prisma.userProfile.findFirst();

  if (existingProfile) {
    console.log("✅ UserProfile already exists — skipping.");
  } else {
    await prisma.userProfile.create({
      data: {
        name: "Nanda Zhafran Mahendra",
        location: "Indonesia (seeking remote worldwide)",
        portfolio: "https://nandaz-portofolio.vercel.app/",

        // Core technical skills
        skills: [
          "Next.js",
          "React",
          "TypeScript",
          "JavaScript",
          "Node.js",
          "Prisma",
          "PostgreSQL",
          "Tailwind CSS",
          "Figma",
          "WordPress",
          "Elementor",
          "UI/UX Design",
          "JWT",
          "RBAC",
          "AI Chatbot",
          "RAG Chatbot",
          "HTML",
          "CSS",
          "Git",
        ],

        // Language proficiency
        languages: {
          english: "Strong — C1 level (reading, writing, speaking)",
          russian: "Basic — A2 level (can read job postings with effort)",
        },

        // Miscellaneous preferences stored as JSON
        preferences: {
          preferredWorkTypes: ["remote", "hybrid"],
          preferredRoles: [
            "Frontend Developer",
            "Junior Frontend Developer",
            "Full-stack Developer",
            "UI/UX Designer",
            "Web Designer",
            "WordPress Developer",
            "AI Chatbot Developer",
          ],
          openToInternship: true,
          openToPartTime: true,
          openToContract: true,
          openToFreelance: true,
          preferEnglishInterface: true,
          notes: "Indonesian final-year Software Engineering student. Strong English, basic Russian.",
        },
      },
    });
    console.log("✅ Created UserProfile for Nanda Zhafran Mahendra.");
  }

  // ── SearchPreference ────────────────────────────────────

  const existingPref = await prisma.searchPreference.findFirst({
    where: { name: "Default" },
  });

  if (existingPref) {
    console.log("✅ Default SearchPreference already exists — skipping.");
  } else {
    await prisma.searchPreference.create({
      data: {
        name: "Default",
        isActive: true,

        // Nanda's target job roles
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

        // Must-have skills (used for AI prompt context)
        requiredSkills: [
          "React",
          "TypeScript",
          "Next.js",
        ],

        // Nice-to-have skills (used for scoring and AI context)
        niceToHaveSkills: [
          "Figma",
          "WordPress",
          "Tailwind CSS",
          "Node.js",
          "PostgreSQL",
        ],

        // HH experience IDs to include in search
        experience: [
          "noExperience",
          "between1And3",
        ],

        // Work format preferences
        workFormat: [
          "remote",
          "hybrid",
        ],

        // No minimum salary filter (open to all, let AI judge)
        salaryMinimum: null,

        // Keywords that auto-disqualify a vacancy before AI sees it
        excludeKeywords: [
          "senior",
          "lead",
          "5+ years",
          "требуется опыт от 5",
          "только офис",
          "relocation not provided",
        ],

        // Red flag keywords surfaced in notifications
        redFlagKeywords: [
          "паспорт",
          "залог",
          "оплата обучения",
          "без оплаты",
          "только telegram",
          "гражданство рф",
        ],

        // Only send Telegram notification if score >= this threshold
        minimumScoreToNotify: 65,

        // Max Telegram notifications per day (prevents spam)
        maxNotificationsPerDay: 15,

        // AI provider fallback order
        aiProviderOrder: [
          "groq",
          "gemini",
          "openrouter",
        ],
      },
    });
    console.log("✅ Created Default SearchPreference.");
  }

  console.log("");
  console.log("🌱 Database seed complete!");
  console.log("   You can now run: npm run dev");
}

// ── Entry Point ───────────────────────────────────────────────

seed()
  .catch((error: unknown) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect Prisma to avoid hanging the process
    await prisma.$disconnect();
    console.log("   Prisma client disconnected.");
  });
