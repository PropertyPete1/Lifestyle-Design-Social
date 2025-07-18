// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • It defines the Video type used across your app.

export type Video = {
  id: string;
  url: string;
  caption: string;
  createdAt: string;
  source: 'real_estate' | 'cartoon';
  scheduledTime: string | null;
  status: 'queued' | 'posted' | 'failed';
}; 