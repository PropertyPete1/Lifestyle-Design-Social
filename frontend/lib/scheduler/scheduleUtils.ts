import { postingWindows } from '../analytics/postingTimes';

export function getNextAvailableSlot(lastPostedAt: Date, platform: keyof typeof postingWindows): Date {
  const nextTime = new Date(lastPostedAt);
  nextTime.setHours(nextTime.getHours() + 4); // Minimum 3-4 hours between posts

  const hour = nextTime.getHours();
  if (!postingWindows[platform] || !postingWindows[platform]) return nextTime;

  if (!postingWindows[platform] || !postingWindows[platform]) return nextTime;

  const { start, end } = postingWindows[platform];
  if (hour < start) nextTime.setHours(start, 0, 0);
  else if (hour > end) {
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(start, 0, 0);
  }

  return nextTime;
} 