import { Video } from '../types/video';

export function getNextPostTimes(videos: Video[]): string[] {
  const now = new Date();
  const intervals = [3, 6, 9]; // hours apart

  return intervals.map((hourOffset, index) => {
    const postTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
    return postTime.toISOString();
  });
} 