import { db } from "../db/mongoClient";
import { saveCaptionPerformance } from '../db/captionStorage';

export async function logDailyPerformance(postId: string, views: number, likes: number, comments: number) {
  return db.collection("daily_metrics").insertOne({
    postId,
    views,
    likes,
    comments,
    trackedAt: new Date(),
  });
}

export async function logPostAnalytics(videoId: string, caption: string, views: number) {
  const performanceScore = views > 5000 ? 100 : views > 1000 ? 75 : 50;
  await saveCaptionPerformance(caption, performanceScore);
} 