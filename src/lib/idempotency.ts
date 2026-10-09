// Simple Idempotency Key Store
// For production, this should be backed by a database or Redis to persist across instances.

const idempotencyStore = new Map<string, { status: 'processing' | 'done', response?: any, expiresAt: number }>();

export function checkIdempotency(key: string, ttlMs: number = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const record = idempotencyStore.get(key);

  if (record && record.expiresAt > now) {
    return { exists: true, status: record.status, response: record.response };
  }

  // Set processing initially
  idempotencyStore.set(key, { status: 'processing', expiresAt: now + ttlMs });
  return { exists: false };
}

export function saveIdempotencyResult(key: string, response: any) {
  const record = idempotencyStore.get(key);
  if (record) {
    record.status = 'done';
    record.response = response;
  }
}
