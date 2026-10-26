import { describe, it, expect } from "vitest";
import { calculateRuleScore } from "@/lib/scoring";
import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

describe("calculateRuleScore", () => {
  const baseVacancy: NormalizedVacancy = {
    hhId: "123456",
    title: "Frontend Developer",
    description: "Looking for a React and TypeScript engineer. Remote work available.",
    schedule: "remote",
    workFormat: [{ id: "remote", name: "Удаленная работа" }],
    snippet: {
      requirement: "Strong React skills",
      responsibility: "Build modern web apps",
    },
    experience: "between1And3",
  };

  const defaultPref: SearchPreferenceData = {
    id: "pref-test-1",
    name: "Frontend Profile",
    targetRoles: ["Frontend Developer"],
    searchKeywordsEn: ["react", "typescript"],
    searchKeywordsRu: ["фронтенд"],
    requiredSkills: ["React", "TypeScript"],
    niceToHaveSkills: ["Tailwind", "Next.js"],
    experience: ["between1And3"],
    workFormat: ["remote"],
    salaryMinimum: 100000,
    salaryCurrency: "RUR",
    excludeKeywords: ["gambling"],
    redFlagKeywords: ["passport"],
    minimumScoreToNotify: 70,
    maxNotificationsPerDay: 20,
    aiProviderOrder: ["groq", "gemini"],
    coverLetterLanguage: "English",
    resumeText: "Experienced React Developer",
    isActive: true,
  };

  it("calculates high score for well-matched remote frontend vacancy", () => {
    const result = calculateRuleScore(baseVacancy, defaultPref);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons.some((r) => r.includes("Title matches target roles"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Remote work format supported"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Matches candidate skills"))).toBe(true);
  });

  it("applies penalty for Russian citizenship requirement", () => {
    const vacancyWithCitizenship: NormalizedVacancy = {
      ...baseVacancy,
      description: "Гражданство РФ обязательно. Remote work available.",
    };
    const result = calculateRuleScore(vacancyWithCitizenship, defaultPref);
    expect(result.penalties.some((p) => p.includes("Requires Russian citizenship"))).toBe(true);
  });

  it("penalizes scam indicators like paying for training", () => {
    const scamVacancy: NormalizedVacancy = {
      ...baseVacancy,
      description: "Оплата обучения кандидатом обязательна перед выходом.",
    };
    const result = calculateRuleScore(scamVacancy, defaultPref);
    expect(result.penalties.some((p) => p.includes("Suspicious signals detected"))).toBe(true);
  });

  it("avoids false positives on word boundaries (e.g. leading != lead)", () => {
    const leadingCompanyVacancy: NormalizedVacancy = {
      ...baseVacancy,
      title: "Junior Developer at Leading Tech Firm",
      description: "We are a leading provider of cloud solutions.",
    };
    // Should NOT trigger team lead penalty just because the word 'leading' is present
    const result = calculateRuleScore(leadingCompanyVacancy, defaultPref);
    expect(result.penalties.some((p) => p.includes("Senior/lead role"))).toBe(false);
  });

  it("clamps score between 0 and 100", () => {
    const severeScamVacancy: NormalizedVacancy = {
      hhId: "999",
      title: "Odd Job",
      description: "Оплата обучения кандидатом. Работа без оплаты. Скан паспорта. Код из смс.",
      experience: "moreThan6",
    };
    const result = calculateRuleScore(severeScamVacancy, defaultPref);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
