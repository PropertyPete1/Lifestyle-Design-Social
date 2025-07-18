import { connectToDatabase } from '@/lib/db';

interface YouTubeLog {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  postedAt: Date;
}

export async function logYouTubePost(log: YouTubeLog): Promise<void> {
  const db = await connectToDatabase();
  await db.collection('youtube_logs').insertOne({
    ...log,
    postedAt: new Date(),
  });
} 