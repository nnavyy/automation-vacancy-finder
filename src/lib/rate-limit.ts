// Simple In-Memory Rate Limiter
// In a true production environment (multi-instance), use Redis (e.g., @upstash/ratelimit)

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const limits = new Map<string, RateLimitRecord>();

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = limits.get(identifier);

  if (!record) {
    limits.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (now > record.resetAt) {
    // Window expired, reset
    limits.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
