export const postingWindows = {
  instagram: { start: 8, end: 21 },
  tiktok: { start: 9, end: 22 },
  youtube: { start: 10, end: 21 }
};

export function isWithinPostingWindow(platform: keyof typeof postingWindows, hour: number): boolean {
  const window = postingWindows[platform];
  return hour >= window.start && hour <= window.end;
} 