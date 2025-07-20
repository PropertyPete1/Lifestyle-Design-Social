import { db } from './mongoClient';
import { ObjectId } from 'mongodb';

export interface FailedPost {
  id: string;
  videoId: string;
  type: 'user' | 'cartoon';
  error: string;
  timestamp: Date;
  retryCount: number;
}

export async function getFailedPosts(): Promise<FailedPost[]> {
  const failedPosts = await db.collection("post_logs").find({
    status: "failed",
    retryCount: { $lt: 3 }
  }).toArray();

  return failedPosts.map(post => ({
    id: post._id.toString(),
    videoId: post.videoId,
    type: post.type,
    error: post.error,
    timestamp: post.timestamp,
    retryCount: post.retryCount || 0
  }));
}

export async function updateRetryCount(postId: string, retryCount: number) {
  return db.collection("post_logs").updateOne(
    { _id: new ObjectId(postId) },
    { $set: { retryCount, lastRetryAt: new Date() } }
  );
} 