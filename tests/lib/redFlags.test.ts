import { describe, it, expect } from "vitest";
import { detectRedFlags } from "@/lib/redFlags";

describe("detectRedFlags", () => {
  it("detects high severity unpaid work", () => {
    const text = "Мы предлагаем интересные задачи, работа без оплаты в течение испытательного срока.";
    const flags = detectRedFlags(text);
    expect(flags.some((f) => f.severity === "high" && f.trigger_text === "без оплаты")).toBe(true);
  });

  it("detects sensitive document and security code scams", () => {
    const text = "Для оформления отправьте скан паспорта и код из смс нашему менеджеру.";
    const flags = detectRedFlags(text);
    expect(flags.some((f) => f.trigger_text.includes("паспорт") || f.trigger_text.includes("смс"))).toBe(true);
  });

  it("detects upfront fee / deposit requirements", () => {
    const text = "Необходимо внести возвратный взнос за предоставленное оборудование.";
    const flags = detectRedFlags(text);
    expect(flags.some((f) => f.severity === "high" && f.trigger_text === "возвратный взнос")).toBe(true);
  });

  it("detects custom user red flags", () => {
    const text = "Требуется опыт работы с холодными звонками и навязыванием услуг.";
    const customFlags = ["холодными звонками"];
    const flags = detectRedFlags(text, customFlags);
    expect(flags.some((f) => f.trigger_text === "холодными звонками")).toBe(true);
    expect(flags.some((f) => f.reason.includes("Matched user red-flag filter"))).toBe(true);
  });

  it("adds low severity flag for very short descriptions without salary mention", () => {
    const shortText = "Срочно ищем разработчика в офис. Звоните.";
    const flags = detectRedFlags(shortText);
    expect(flags.some((f) => f.severity === "low" && f.trigger_text.includes("no salary info"))).toBe(true);
  });

  it("returns empty flags list for clean, detailed vacancy", () => {
    const cleanText = `
      Компания TechCorp ищет React / TypeScript разработчика.
      Зарплата от 150 000 до 200 000 руб на руки.
      Обязанности: проектирование компонентов, код-ревью, написание тестов.
      Требования: опыт коммерческой разработки от 2 лет, хорошее знание современного стека.
      Условия: полностью удаленная работа, гибкий график, ДМС со стоматологией, оплата профильных курсов.
    `;
    const flags = detectRedFlags(cleanText);
    expect(flags.length).toBe(0);
  });
});
