type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const limits = new Map<string, RateLimitRecord>();

// Cleanup stale keys periodically to avoid memory leaks
let lastCleanup = Date.now();
function cleanupStaleRecords() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, record] of limits.entries()) {
    if (now > record.resetAt) {
      limits.delete(key);
    }
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  cleanupStaleRecords();
  const now = Date.now();
  const record = limits.get(identifier);

  if (!record) {
    limits.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (now > record.resetAt) {
    limits.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
