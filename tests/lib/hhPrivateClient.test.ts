import { describe, it, expect } from "vitest";
import { detectHHAuthType, getCleanOAuthToken, formatHHCookies } from "@/lib/hhPrivateClient";

describe("hhPrivateClient auth helpers", () => {
  it("detects oauth_bearer for prefixed tokens", () => {
    expect(detectHHAuthType("oauth:USER_OAUTH_TOKEN_VALUE_1234567890")).toBe("oauth_bearer");
    expect(getCleanOAuthToken("oauth:USER_OAUTH_TOKEN_VALUE_1234567890")).toBe("USER_OAUTH_TOKEN_VALUE_1234567890");
  });

  it("detects oauth_bearer for standalone 32+ char token strings", () => {
    const rawOAuthToken = "AABBCCDDEEFF00112233445566778899AABBCCDD";
    expect(detectHHAuthType(rawOAuthToken)).toBe("oauth_bearer");
    // formatHHCookies should not corrupt it with hhtoken=
    expect(formatHHCookies(rawOAuthToken)).toBe(rawOAuthToken);
  });

  it("detects cookie_session for cookie key-value or semicolon strings", () => {
    const fullCookie = "hhtoken=abc12345; hhuid=98765432; __ddg1_=123";
    expect(detectHHAuthType(fullCookie)).toBe("cookie_session");
    expect(formatHHCookies(fullCookie)).toBe(fullCookie);
  });

  it("adds hhtoken= prefix to short legacy web tokens", () => {
    const legacyToken = "shortTokenValue123";
    expect(detectHHAuthType(legacyToken)).toBe("cookie_session");
    expect(formatHHCookies(legacyToken)).toBe(`hhtoken=${legacyToken}`);
  });
});
