export function getRetryDelay(attempt: number): number {
  return Math.min(30000, Math.pow(2, attempt) * 1000);
} 