import { db } from './connect';
import { Video } from '@/types/video';

export async function getCartoonVideos(): Promise<Video[]> {
  return db.collection('videos')
    .find({ type: 'cartoon', posted: false })
    .sort({ createdAt: 1 })
    .limit(1)
    .toArray();
}

export async function markVideoAsPosted(videoId: string) {
  return db.collection('videos')
    .updateOne({ id: videoId }, { $set: { posted: true } });
} 