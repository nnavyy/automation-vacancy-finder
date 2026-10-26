import { timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison to prevent timing attacks on secrets and tokens.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
