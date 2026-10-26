import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    vacancyAnalysis: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    vacancy: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/aiAnalyzer", () => ({
  analyzeVacancy: vi.fn(),
}));

vi.mock("@/lib/feedbackLearning", () => ({
  getSimilarFeedbackExamples: vi.fn(),
}));

import prisma from "@/lib/db";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import {
  retryPendingAnalyses,
  PENDING_AI_STATUSES,
  PENDING_AI_MAX_AGE_MS,
} from "@/lib/pendingAiRetry";

const mockedDb = vi.mocked(prisma);
const mockedAnalyze = vi.mocked(analyzeVacancy);
const mockedFeedback = vi.mocked(getSimilarFeedbackExamples);

describe("retryPendingAnalyses", () => {
  const userId = "user-123";
  const pref = { title: "Frontend Developer" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFeedback.mockResolvedValue({ positive: [], negative: [] });
    (mockedDb.vacancyAnalysis.updateMany as any).mockResolvedValue({ count: 0 });
    (mockedDb.vacancy.findMany as any).mockResolvedValue([]);
    (mockedDb.vacancyAnalysis.update as any).mockResolvedValue({});
  });

  it("finalizes stale rows older than 3 days to rule_based_only and records count", async () => {
    (mockedDb.vacancyAnalysis.updateMany as any).mockResolvedValueOnce({ count: 3 });

    const result = await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() + 10000,
    });

    expect(result.expired).toBe(3);
    expect(mockedDb.vacancyAnalysis.updateMany).toHaveBeenCalledWith({
      where: {
        aiStatus: { in: PENDING_AI_STATUSES },
        vacancy: {
          userId,
          createdAt: { lt: expect.any(Date) },
        },
      },
      data: { aiStatus: "rule_based_only" },
    });
  });

  it("updates completed analysis when retry succeeds", async () => {
    const mockVacancyRow = {
      id: "vac-1",
      hhId: "111",
      title: "React Engineer",
      company: "Acme Corp",
      area: "Remote",
      salary: null,
      url: "https://hh.ru/111",
      applyUrl: null,
      apiUrl: null,
      experience: null,
      employment: null,
      schedule: null,
      workFormat: null,
      snippet: null,
      description: "Full job description",
      descriptionHash: "hash123",
      sourceKeyword: "react",
      createdAt: new Date(),
    };

    (mockedDb.vacancy.findMany as any).mockResolvedValueOnce([mockVacancyRow]);
    (mockedAnalyze as any).mockResolvedValueOnce({
      analysis: {
        match_score: 85,
        recommendation: "apply",
        best_language: "english",
        summary: "Good match",
        match_reasons: ["React expert"],
        missing_requirements: [],
        red_flags: [],
        cover_letter: "I am excited to apply...",
        questions_to_recruiter: [],
        confidence: 90,
      },
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      aiStatus: "completed",
    });

    const result = await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() + 10000,
      limit: 5,
    });

    expect(result.retried).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.errors).toBe(0);

    expect(mockedDb.vacancyAnalysis.update).toHaveBeenCalledWith({
      where: { vacancyId: "vac-1" },
      data: expect.objectContaining({
        matchScore: 85,
        recommendation: "apply",
        aiStatus: "completed",
        providerUsed: "groq",
        modelUsed: "llama-3.3-70b-versatile",
        coverLetter: "I am excited to apply...",
      }),
    });
  });

  it("leaves status unchanged when retry returns pending_ai (still rate limited)", async () => {
    const mockVacancyRow = {
      id: "vac-2",
      hhId: "222",
      title: "Backend Engineer",
      company: null,
      area: null,
      salary: null,
      url: null,
      applyUrl: null,
      apiUrl: null,
      experience: null,
      employment: null,
      schedule: null,
      workFormat: null,
      snippet: null,
      description: null,
      descriptionHash: null,
      sourceKeyword: null,
      createdAt: new Date(),
    };

    (mockedDb.vacancy.findMany as any).mockResolvedValueOnce([mockVacancyRow]);
    (mockedAnalyze as any).mockResolvedValueOnce({
      analysis: {
        match_score: 50,
        recommendation: "maybe",
        best_language: "russian",
        summary: "Rule-based fallback",
        match_reasons: [],
        missing_requirements: [],
        red_flags: [],
        cover_letter: "",
        questions_to_recruiter: [],
        confidence: 50,
      },
      provider: "rule_based",
      model: "rules",
      aiStatus: "pending_ai",
    });

    const result = await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() + 10000,
    });

    expect(result.retried).toBe(1);
    expect(result.completed).toBe(0);
    expect(mockedDb.vacancyAnalysis.update).not.toHaveBeenCalled();
  });

  it("stops early when deadline has passed", async () => {
    const mockRow = (id: string) => ({
      id,
      hhId: id,
      title: "Job " + id,
      company: null,
      area: null,
      salary: null,
      url: null,
      applyUrl: null,
      apiUrl: null,
      experience: null,
      employment: null,
      schedule: null,
      workFormat: null,
      snippet: null,
      description: null,
      descriptionHash: null,
      sourceKeyword: null,
      createdAt: new Date(),
    });

    (mockedDb.vacancy.findMany as any).mockResolvedValueOnce([mockRow("1"), mockRow("2")]);

    // Already expired deadline
    const result = await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() - 100,
    });

    expect(result.retried).toBe(0);
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("passes limit as take parameter", async () => {
    await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() + 5000,
      limit: 10,
    });

    expect(mockedDb.vacancy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );
  });

  it("records errors when analyzeVacancy throws without aborting remaining retries", async () => {
    const mockRow = (id: string) => ({
      id,
      hhId: id,
      title: "Job " + id,
      company: null,
      area: null,
      salary: null,
      url: null,
      applyUrl: null,
      apiUrl: null,
      experience: null,
      employment: null,
      schedule: null,
      workFormat: null,
      snippet: null,
      description: null,
      descriptionHash: null,
      sourceKeyword: null,
      createdAt: new Date(),
    });

    (mockedDb.vacancy.findMany as any).mockResolvedValueOnce([mockRow("err"), mockRow("ok")]);
    (mockedAnalyze as any)
      .mockRejectedValueOnce(new Error("Network crash"))
      .mockResolvedValueOnce({
        analysis: {
          match_score: 90,
          recommendation: "apply",
          best_language: "english",
          summary: "ok",
          match_reasons: [],
          missing_requirements: [],
          red_flags: [],
          cover_letter: "letter",
          questions_to_recruiter: [],
          confidence: 90,
        },
        provider: "openai",
        model: "gpt-4o",
        aiStatus: "completed",
      });

    const result = await retryPendingAnalyses({
      userId,
      pref,
      deadline: Date.now() + 10000,
    });

    expect(result.retried).toBe(2);
    expect(result.errors).toBe(1);
    expect(result.completed).toBe(1);
  });
});
