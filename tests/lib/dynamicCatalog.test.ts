import { describe, it, expect, vi } from "vitest";
import { detectLanguage, mergeCatalogs } from "@/lib/catalog/dynamic";
import type { CatalogItem } from "@/lib/catalog/data";

describe("dynamic catalog utilities", () => {
  it("detects Russian and English language strings correctly", () => {
    expect(detectLanguage("Фронтенд разработчик")).toBe("ru");
    expect(detectLanguage("Frontend Developer")).toBe("en");
    expect(detectLanguage("React разработчик")).toBe("all"); // mixed Latin + Cyrillic
  });

  it("merges dynamic items ahead of static baseline items", () => {
    const staticItems: CatalogItem[] = [
      { value: "Frontend Developer" },
      { value: "Backend Developer" },
    ];

    const dynamicItems: CatalogItem[] = [
      { value: "SvelteKit Developer" }, // newly discovered popular term
      { value: "Frontend Developer" }, // existing term with high usage
    ];

    const merged = mergeCatalogs(staticItems, dynamicItems);

    expect(merged[0].value).toBe("SvelteKit Developer");
    expect(merged[1].value).toBe("Frontend Developer");
    expect(merged[2].value).toBe("Backend Developer");
    expect(merged).toHaveLength(3); // deduped
  });
});
