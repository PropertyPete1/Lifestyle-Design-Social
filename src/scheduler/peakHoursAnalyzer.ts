import { getViewerActivityLogs } from '../lib/analytics/viewerActivity';

interface ViewerActivityLog {
  timestamp: Date;
  [key: string]: any;
}

export async function getPeakHoursForUser(userId: string): Promise<number[]> {
  const logs: ViewerActivityLog[] = await getViewerActivityLogs(userId);
  const hourCounts: Record<number, number> = {};

  logs.forEach((log) => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return sortedHours;
} 