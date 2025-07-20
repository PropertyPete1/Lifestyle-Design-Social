import { db } from "../db/mongoClient";
import { saveCaptions } from '../db/captionStorage';
import { trackHashtags } from '../hashtags/performanceTracker';
import * as Sentry from '@sentry/node';

export async function logPostSuccess(video: any, caption: string, type: "user" | "cartoon") {
  return db.collection("post_logs").insertOne({
    type,
    videoId: video.id,
    caption,
    timestamp: new Date(),
    status: "success",
  });
}

export async function logPostFailure(video: any, error: string) {
  return db.collection("post_logs").insertOne({
    type: video.type,
    videoId: video.id,
    timestamp: new Date(),
    status: "failed",
    error,
  });
}

export async function logCaptionResult(caption: string, hashtags: string[], views: number) {
  const engagement = views; // you can weight it later with shares, likes, etc.
  await saveCaptions([caption]);
}

export async function logPost(caption: string, views: number) {
  console.log(`[Post Log] Views: ${views}`);
  await trackHashtags(caption, views);
}

export function logSimplePostSuccess(videoId: string) {
  console.log(`✅ Post succeeded for video ${videoId}`);
}

export function logSimplePostFailure(videoId: string, reason: string) {
  console.error(`❌ Post failed for video ${videoId}: ${reason}`);
  Sentry.captureMessage(`Instagram post failed: ${videoId} - ${reason}`, 'error');
} 