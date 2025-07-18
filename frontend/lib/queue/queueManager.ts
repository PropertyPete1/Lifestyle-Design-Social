import { getNextAvailableSlot } from '../scheduler/scheduleUtils';

export type ScheduledPost = {
  videoId: string;
  platform: 'instagram' | 'youtube';
  type: 'real_estate' | 'cartoon';
  scheduledAt: Date;
};

export function rotateContent(posts: ScheduledPost[]): ScheduledPost[] {
  const result: ScheduledPost[] = [];

  let toggle = true;
  const realEstate = posts.filter(p => p.type === 'real_estate');
  const cartoon = posts.filter(p => p.type === 'cartoon');

  while (realEstate.length || cartoon.length) {
    const next = toggle ? realEstate.shift() : cartoon.shift();
    if (next) result.push(next);
    toggle = !toggle;
  }

  return result;
}

export function autoScheduleQueue(
  videos: { id: string; platform: 'instagram' | 'youtube'; type: 'real_estate' | 'cartoon' }[],
  startAt: Date
): ScheduledPost[] {
  const queue: ScheduledPost[] = [];
  let currentTime = new Date(startAt);

  const ordered = rotateContent(
    videos.map(v => ({ videoId: v.id, platform: v.platform, type: v.type, scheduledAt: new Date() }))
  );

  for (const post of ordered) {
    currentTime = getNextAvailableSlot(currentTime, post.platform);
    queue.push({ ...post, scheduledAt: new Date(currentTime) });
  }

  return queue;
} 