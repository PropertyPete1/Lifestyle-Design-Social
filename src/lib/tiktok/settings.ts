export function getTikTokAccessKey(): string | null {
  return process.env.TIKTOK_API_KEY || null;
} 