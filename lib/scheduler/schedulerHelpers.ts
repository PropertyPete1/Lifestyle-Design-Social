import { Video } from '@/types';

export function groupVideosByDate(videos: Video[]) {
  const map: { [key: string]: Video[] } = {};

  for (const video of videos) {
    const date = video.scheduledDate || 'Unscheduled';
    if (!map[date]) map[date] = [];
    map[date].push(video);
  }

  return map;
} 