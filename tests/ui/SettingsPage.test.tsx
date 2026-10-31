import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ language: "en", setLanguage: vi.fn(), t: (key: string) => key }) }));
vi.mock("@/components/ui/TagInput", () => ({ default: () => null }));
import SettingsPage from "@/app/dashboard/settings/page";

afterEach(() => { vi.unstubAllGlobals(); });

it("never autosaves defaults after settings fail to load", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: false }, { status: 500 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<SettingsPage />);
  const portfolio = await screen.findByPlaceholderText("https://yourportfolio.dev");
  fireEvent.change(portfolio, { target: { value: "https://example.com" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(0);
});
