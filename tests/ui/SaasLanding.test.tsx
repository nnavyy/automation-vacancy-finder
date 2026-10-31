import { expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import LandingView from "@/components/landing/LandingView";

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
  expect(within(pricing).getByText("$3")).toBeTruthy();
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
