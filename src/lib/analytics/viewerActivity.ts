import { db } from "../db/mongoClient";

export async function recordViewerEngagement(hour: number, likes: number, views: number) {
  return db.collection("viewer_engagement").updateOne(
    { hour },
    { $inc: { likes, views, count: 1 } },
    { upsert: true }
  );
}

export async function getBestPostingHours(): Promise<number[]> {
  const data = await db.collection("viewer_engagement").find().sort({ views: -1 }).limit(3).toArray();
  return data.map((entry) => entry.hour);
}

// Added for peak hour analysis
export async function getViewerActivityLogs(userId: string) {
  // This assumes viewer_engagement logs have a userId field
  // If not, adjust as needed for your schema
  return db.collection("viewer_engagement")
    .find({ userId })
    .toArray();
} 