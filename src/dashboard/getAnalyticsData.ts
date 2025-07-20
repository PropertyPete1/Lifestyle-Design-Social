import { db } from '../lib/db/mongoClient';
import { Document } from 'mongodb';

interface VideoDocument extends Document {
  _id: string;
  url: string;
  type: 'user' | 'cartoon';
  posted: boolean;
  uploadedAt: Date;
  scheduledAt?: Date;
  caption?: string;
  hashtags?: string[];
  thumbnail?: string;
  status?: 'success' | 'failed';
  views?: number;
  createdAt?: Date;
}

export async function getAnalyticsData() {
  const videos = await db.collection("video_queue").find({}).sort({ createdAt: -1 }).toArray() as unknown as VideoDocument[];

  const totalPosts = videos.length;
  const successfulPosts = videos.filter((v: VideoDocument) => v.status === 'success').length;
  const failedPosts = totalPosts - successfulPosts;

  const viewsOverTime = videos.map((v: VideoDocument) => ({
    date: v.createdAt || v.uploadedAt,
    views: v.views || 0,
  }));

  const hashtagStats: Record<string, number> = {};

  videos.forEach((video: VideoDocument) => {
    video.hashtags?.forEach((tag: string) => {
      if (!hashtagStats[tag]) hashtagStats[tag] = 0;
      hashtagStats[tag] += video.views || 0;
    });
  });

  return {
    totalPosts,
    successfulPosts,
    failedPosts,
    viewsOverTime,
    hashtagStats,
  };
} 