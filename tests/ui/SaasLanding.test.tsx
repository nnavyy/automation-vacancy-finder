import { expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import LandingView from "@/components/landing/LandingView";
import LandingActivityPanel from "@/components/landing/LandingActivityPanel";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

it("explains free access and the paid feature without self-hosting claims", () => {
  render(<LandingView />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  const pricing = screen.getByRole("region", { name: "Start free. Go deeper when you need to." });
  expect(within(pricing).getByText("$0")).toBeTruthy();
  expect(within(pricing).getByText("250 Stars")).toBeTruthy();
  expect(within(pricing).getByText("Analytics and application tracking")).toBeTruthy();
  expect(screen.queryByText(/Designed for Open Standards/)).toBeNull();
  expect(screen.queryByText(/100% Local PostgreSQL/)).toBeNull();
});

it("makes the mobile product navigation keyboard operable", () => {
  render(<LandingView />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  const toggle = screen.getByRole("button", { name: "Open navigation" });
  fireEvent.click(toggle);
  expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("button", { name: "Close navigation" }), { key: "Escape" });
  expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
});

it("starts in Russian and opens an interactive preview", () => {
  localStorage.clear();
  render(<LandingView />);
  expect(screen.getByRole("heading", { name: /Меньше поиска/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Открыть интерактивный просмотр" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Закрыть просмотр" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("routes upgrade requests to the owner's Telegram", () => {
  render(<LandingView />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByRole("link", { name: "Arrange access on Telegram" }).getAttribute("href")).toBe("https://t.me/wonkiiy");
});

it("links to the public help and editorial pages from the localized footer", () => {
  render(<LandingView />);
  const footer = screen.getByRole("contentinfo");
  expect(within(footer).getByRole("link", { name: "Сравнение" }).getAttribute("href")).toBe("/compare");
  expect(within(footer).getByRole("link", { name: "Блог" }).getAttribute("href")).toBe("/blog");
  expect(within(footer).getByRole("link", { name: "Архитектура" }).getAttribute("href")).toBe("/architecture");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(within(footer).getByRole("link", { name: "Compare" }).getAttribute("href")).toBe("/compare");
  expect(within(footer).getByRole("link", { name: "User guide" }).getAttribute("href")).toBe("/guide");
  expect(within(footer).getByRole("link", { name: "About" }).getAttribute("href")).toBe("/about");
  expect(within(footer).getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");
  expect(within(footer).getByRole("link", { name: "Architecture" }).getAttribute("href")).toBe("/architecture");
});

it("updates the featured shortlist preview when a different role is selected", () => {
  render(<LandingView />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  const preview = screen.getByRole("region", { name: "Product tour" });
  fireEvent.click(within(preview).getByRole("button", { name: /Full Stack Engineer/ }));
  expect(within(preview).getByRole("progressbar", { name: "Match score" }).getAttribute("value")).toBe("90");
  expect(within(preview).getByText("200 000–260 000 ₽")).toBeTruthy();
});

it("updates the product tour metrics and chart together when the range changes", async () => {
  render(<LandingView />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "Analytics" }));
  expect(await screen.findByRole("heading", { name: "Search activity" })).toBeTruthy();
  expect(screen.getByText("24")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "30 days" }));
  expect(screen.getByText("86")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Matches by interval: 4, 7, 10, 5, 8, 13, 9, 12, 10, 8" })).toBeTruthy();
});

it("shows measured activity including real zero values in the selected language", () => {
  render(<LandingView activity={<LandingActivityPanel snapshot={{
    indexedVacancies: 1234, completedAssessments: 85, trackedApplications: 0,
    measuredAt: "2026-11-25T15:00:00Z",
  }} />} />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  const stats = screen.getByRole("region", { name: "The search in numbers" });
  expect(within(stats).getByText("1,234")).toBeTruthy();
  expect(within(stats).getByText("85")).toBeTruthy();
  expect(within(stats).getByText("0")).toBeTruthy();
  expect(within(stats).getByText(/Updated.*UTC/)).toBeTruthy();
});
