import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit helper", () => {
  it("allows requests up to the configured limit", () => {
    const id = `test-user-${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    const req1 = rateLimit(id, limit, windowMs);
    expect(req1.success).toBe(true);
    expect(req1.remaining).toBe(2);

    const req2 = rateLimit(id, limit, windowMs);
    expect(req2.success).toBe(true);
    expect(req2.remaining).toBe(1);

    const req3 = rateLimit(id, limit, windowMs);
    expect(req3.success).toBe(true);
    expect(req3.remaining).toBe(0);

    // 4th request exceeds limit
    const req4 = rateLimit(id, limit, windowMs);
    expect(req4.success).toBe(false);
    expect(req4.remaining).toBe(0);
  });

  it("resets limit after the time window expires", async () => {
    const id = `test-reset-${Date.now()}`;
    const limit = 1;
    const shortWindowMs = 30; // 30ms

    const first = rateLimit(id, limit, shortWindowMs);
    expect(first.success).toBe(true);

    const second = rateLimit(id, limit, shortWindowMs);
    expect(second.success).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 50));

    const third = rateLimit(id, limit, shortWindowMs);
    expect(third.success).toBe(true);
  });
});
