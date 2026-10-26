import { describe, it, expect } from "vitest";
import { safeEqual } from "@/lib/timingSafe";

describe("timingSafe helper", () => {
  it("returns true for matching strings", () => {
    expect(safeEqual("my-secret-webhook-token", "my-secret-webhook-token")).toBe(true);
    expect(safeEqual("12345", "12345")).toBe(true);
  });

  it("returns false for non-matching strings of same length", () => {
    expect(safeEqual("my-secret-webhook-token1", "my-secret-webhook-token2")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(safeEqual("short", "longer-string")).toBe(false);
  });

  it("handles empty or non-string inputs safely without throwing", () => {
    expect(safeEqual("", "")).toBe(true);
    expect(safeEqual("abc", "")).toBe(false);
    expect(safeEqual(undefined as any, "abc")).toBe(false);
    expect(safeEqual("abc", null as any)).toBe(false);
  });
});
