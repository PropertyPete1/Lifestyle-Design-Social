// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • This manages storing and retrieving cartoon-style videos.

import { getCollection } from '@/lib/db';
import { Video } from '@/types/video';

export async function saveCartoonVideo(video: Video) {
  const collection = await getCollection<Video>('cartoon_videos');
  await collection.insertOne(video);
}

export async function getAllCartoonVideos(): Promise<Video[]> {
  const collection = await getCollection<Video>('cartoon_videos');
  return await collection.find({}).toArray();
} 