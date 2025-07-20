import { getViewerActivityLogs, ViewerActivityLog } from '../../analytics/viewerActivity';

export async function aggregateHourlyPeaks(userId: string): Promise<number[]> {
  const logs = await getViewerActivityLogs(userId);
  const hourlyMap: Record<number, number> = {};

  logs.forEach((log: ViewerActivityLog) => {
    const hour = new Date(log.timestamp).getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
  });

  return Object.entries(hourlyMap)
    .sort((a, b) => b[1] - a[1])
    .map(([hour]) => parseInt(hour));
} 