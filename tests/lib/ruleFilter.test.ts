import { describe, it, expect } from "vitest";
import { passesBasicFilter } from "@/lib/ruleFilter";
import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

describe("passesBasicFilter", () => {
  const basePref: SearchPreferenceData = {
    id: "pref-filter-1",
    name: "Filter Profile",
    targetRoles: ["Frontend Developer"],
    searchKeywordsEn: ["frontend"],
    searchKeywordsRu: ["фронтенд"],
    requiredSkills: ["React"],
    niceToHaveSkills: [],
    experience: ["between1And3"],
    workFormat: ["remote"],
    salaryCurrency: "RUR",
    excludeKeywords: ["казино", "crypto scam"],
    redFlagKeywords: ["паспорт", "залог"],
    minimumScoreToNotify: 70,
    maxNotificationsPerDay: 20,
    aiProviderOrder: ["groq"],
    coverLetterLanguage: "English",
    resumeText: "Developer resume",
    isActive: true,
  };

  const validVacancy: NormalizedVacancy = {
    hhId: "1001",
    title: "React Frontend Engineer",
    description: "Developing modern web interfaces in React and Next.js.",
    snippet: { requirement: "1-3 years experience with TypeScript" },
    experience: "between1And3",
  };

  it("passes normal qualified vacancy", () => {
    const result = passesBasicFilter(validVacancy, basePref);
    expect(result.passes).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects vacancy containing user excluded keywords", () => {
    const vacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Разработка игр для онлайн казино и слотов.",
    };
    const result = passesBasicFilter(vacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain('Contains excluded keyword: "казино"');
  });

  it("rejects vacancy containing user red flag keywords", () => {
    const vacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Перед собеседованием требуется внести залог.",
    };
    const result = passesBasicFilter(vacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain('Contains user red-flag keyword: "залог"');
  });

  it("rejects unpaid positions and scams", () => {
    const unpaidVacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Стажировка в стартапе, работа без оплаты на первые 3 месяца.",
    };
    const result = passesBasicFilter(unpaidVacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain("unpaid role");
  });

  it("rejects payment from applicant (course fees / training fees)", () => {
    const scamVacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Оплата обучения кандидатом производится перед допуском к работе.",
    };
    const result = passesBasicFilter(scamVacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain("Requests financial payment from applicant");
  });

  it("rejects sensitive document / OTP requests", () => {
    const otpVacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Для верификации аккаунта пришлите смс-код сотруднику.",
    };
    const result = passesBasicFilter(otpVacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain("Requests sensitive personal documents or OTP code");
  });

  it("allows Russian citizenship when text explicitly says not required", () => {
    const vacancy: NormalizedVacancy = {
      ...validVacancy,
      description: "Гражданство РФ не требуется. Удаленная работа из любой точки мира.",
    };
    const result = passesBasicFilter(vacancy, basePref);
    expect(result.passes).toBe(true);
  });

  it("rejects non-target technical support and call center roles", () => {
    const supportVacancy: NormalizedVacancy = {
      ...validVacancy,
      title: "Специалист технической поддержки",
    };
    const result = passesBasicFilter(supportVacancy, basePref);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain("Title indicates non-target support/sales/operator role");

    const technicianVacancy: NormalizedVacancy = {
      ...validVacancy,
      title: "Техник по обслуживанию оборудования",
    };
    const techResult = passesBasicFilter(technicianVacancy, basePref);
    expect(techResult.passes).toBe(false);

    const sysadminVacancy: NormalizedVacancy = {
      ...validVacancy,
      title: "Системный администратор Linux",
    };
    const sysResult = passesBasicFilter(sysadminVacancy, basePref);
    expect(sysResult.passes).toBe(false);

    const callCenterVacancy: NormalizedVacancy = {
      ...validVacancy,
      title: "Оператор call-центра на дому",
    };
    const callResult = passesBasicFilter(callCenterVacancy, basePref);
    expect(callResult.passes).toBe(false);
  });
});
