import { db } from "../db/mongoClient";

export async function getTodaySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const posts = await db.collection("post_logs").find({ timestamp: { $gte: today } }).toArray();
  const metrics = await db.collection("daily_metrics").find({ trackedAt: { $gte: today } }).toArray();

  return { posts, metrics };
} 