import { describe, it, expect } from "vitest";
import { searchCatalog } from "@/lib/catalog/search";
import { ROLES, SKILLS, KEYWORDS_RU } from "@/lib/catalog/data";

describe("searchCatalog", () => {
  it("returns empty for empty / whitespace query", () => {
    expect(searchCatalog(ROLES, "")).toEqual([]);
    expect(searchCatalog(ROLES, "   ")).toEqual([]);
  });

  it("suggests Frontend Developer for 'fron'", () => {
    const res = searchCatalog(ROLES, "fron");
    expect(res[0]).toBe("Frontend Developer");
    expect(res).toContain("Frontend Engineer");
  });

  it("matches aliases (k8s -> Kubernetes, js -> JavaScript)", () => {
    expect(searchCatalog(SKILLS, "k8s")[0]).toBe("Kubernetes");
    expect(searchCatalog(SKILLS, "js")).toContain("JavaScript");
  });

  it("matches Russian aliases", () => {
    expect(searchCatalog(ROLES, "тестировщик")).toContain("QA Engineer");
    expect(searchCatalog(KEYWORDS_RU, "front")[0]).toBe("Фронтенд-разработчик");
  });

  it("is case-insensitive and tolerates separators", () => {
    expect(searchCatalog(ROLES, "FULL STACK")).toContain("Fullstack Developer");
    expect(searchCatalog(SKILLS, "NEXT")).toContain("Next.js");
  });

  it("ranks prefix above substring", () => {
    const res = searchCatalog(SKILLS, "java");
    expect(res.indexOf("Java")).toBeLessThan(res.indexOf("TypeScript") === -1 ? 99 : res.indexOf("TypeScript"));
    expect(res[0]).toBe("Java");
  });

  it("excludes already selected values (case-insensitive)", () => {
    const res = searchCatalog(ROLES, "fron", { exclude: ["frontend developer"] });
    expect(res).not.toContain("Frontend Developer");
    expect(res).toContain("Frontend Engineer");
  });

  it("respects limit", () => {
    expect(searchCatalog(ROLES, "e", { limit: 3 }).length).toBeLessThanOrEqual(3);
  });

  it("returns nothing for gibberish", () => {
    expect(searchCatalog(ROLES, "zzzzqqq")).toEqual([]);
  });

  it("catalog has no duplicate values", () => {
    for (const cat of [ROLES, SKILLS, KEYWORDS_RU]) {
      const vals = cat.map((c) => c.value.toLowerCase());
      expect(new Set(vals).size).toBe(vals.length);
    }
  });
});
