import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "@/lib/security";

describe("public URL validation", () => {
  it.each([
    "http://[::ffff:127.0.0.1]/", "http://[::ffff:10.0.0.1]/", "http://[::]/",
    "http://localhost./", "http://metadata/", "http://100.100.100.200/", "http://224.0.0.1/",
    "https://user:password@example.com/",
  ])("blocks non-public or credential-bearing URLs: %s", (url) => {
    expect(isSafePublicUrl(url)).toBe(false);
  });
  it.each(["https://example.com/", "https://8.8.8.8/", "https://[2606:4700:4700::1111]/"])("allows public URLs: %s", (url) => {
    expect(isSafePublicUrl(url)).toBe(true);
  });
});
