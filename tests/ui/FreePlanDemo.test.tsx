import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DemoPage from "@/app/demo/page";

it("shows the free plan, keeps Analytics available, and locks Company Intel at $3 per month", () => {
  render(<DemoPage />);
  fireEvent.click(screen.getByRole("button", { name: "Company Intel" }));
  expect(screen.getByText("$3")).toBeTruthy();
  expect(screen.getByText("/ month")).toBeTruthy();
  expect(screen.queryByText("Direct Channel:", { exact: false })).toBeNull();
  expect(screen.queryByText("Telegram Direct Contact")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Analytics/ }));
  expect(screen.getByText("Synergy & Compensation Distribution")).toBeTruthy();
});
