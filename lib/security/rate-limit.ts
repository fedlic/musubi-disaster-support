const attempts = new Map<string, number[]>();

export function allowRequest(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) {
    for (const [entry, times] of attempts) if (!times.some((time) => now - time < windowMs)) attempts.delete(entry);
  }
  return true;
}
