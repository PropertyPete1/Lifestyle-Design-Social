export interface ViewerActivityLog {
  userId: string;
  timestamp: string;
}

const dummyLogs: ViewerActivityLog[] = [
  { userId: '123', timestamp: '2025-07-18T08:10:00Z' },
  { userId: '123', timestamp: '2025-07-18T14:30:00Z' },
  { userId: '123', timestamp: '2025-07-19T14:45:00Z' },
];

export async function getViewerActivityLogs(userId: string): Promise<ViewerActivityLog[]> {
  return dummyLogs.filter((log) => log.userId === userId);
} 