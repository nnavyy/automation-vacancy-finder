import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  head: vi.fn(), owned: vi.fn(), analyze: vi.fn(), update: vi.fn(), notify: vi.fn(),
  findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0),
}));
vi.mock("axios", () => ({ default: { head: mocks.head, create: () => ({}) } }));
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: async () => ({ id: "user-1" }), getOwnedVacancy: mocks.owned }));
vi.mock("@/lib/db", () => ({ default: {
  searchPreference: { findFirst: mocks.findFirst },
  vacancy: { update: mocks.update, findMany: mocks.findMany, count: mocks.count },
  vacancyAnalysis: { upsert: vi.fn() },
  telegramLink: { findFirst: async () => ({ telegramChatId: "chat" }) },
} }));
vi.mock("@/lib/aiAnalyzer", () => ({ analyzeVacancy: mocks.analyze }));
vi.mock("@/lib/feedbackLearning", () => ({ getSimilarFeedbackExamples: async () => ({ positive: [], negative: [] }) }));
vi.mock("@/lib/scoring", () => ({ calculateRuleScore: () => ({ score: 75 }) }));
vi.mock("@/lib/telegram", () => ({ sendVacancyNotificationToUser: mocks.notify }));
import { checkVacancyStillOpen } from "@/lib/hhPublicVacancyClient";
import { POST as analyze } from "@/app/api/vacancies/analyze/route";
import { GET as vacancies } from "@/app/api/vacancies/route";

beforeEach(() => { vi.clearAllMocks(); mocks.findFirst.mockResolvedValue({ minimumScoreToNotify: 70 }); });

describe("vacancy data safety", () => {
  it.each([403, 429, 500, 503])("does not treat HTTP %s as proof that a vacancy is closed", async (status) => {
    mocks.head.mockResolvedValue({ status });
    expect(await checkVacancyStillOpen("123")).toBe(true);
  });
  it.each([404, 410])("treats HTTP %s as closed", async (status) => {
    mocks.head.mockResolvedValue({ status });
    expect(await checkVacancyStillOpen("123")).toBe(false);
  });
  it("preserves an application's status when reanalyzing it", async () => {
    mocks.owned.mockResolvedValue({ id: "vacancy-1", hhId: "123", title: "Developer", status: "applied_hh" });
    mocks.analyze.mockResolvedValue({ analysis: { match_score: 50 }, provider: "groq", model: "test", aiStatus: "completed" });
    const response = await analyze(new NextRequest("http://localhost/api/vacancies/analyze", { method: "POST", body: JSON.stringify({ vacancyId: "vacancy-1" }) }));
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "applied_hh" } }));
  });
  it.each(["page=bad", "limit=bad"])("returns a client error for invalid pagination: %s", async (query) => {
    const response = await vacancies(new NextRequest(`http://localhost/api/vacancies?${query}`));
    expect(response.status).toBe(400);
  });
});
