const recentCalls: Record<string, number[]> = {};

export function limitRequests(userId: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const calls = recentCalls[userId] || [];

  const recent = calls.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;

  recent.push(now);
  recentCalls[userId] = recent;
  return true;
} 