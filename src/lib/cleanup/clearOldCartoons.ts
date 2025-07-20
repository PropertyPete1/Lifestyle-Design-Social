import { db } from "../db/mongoClient";

export async function clearOldCartoons() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await db.collection("video_queue").deleteMany({
    type: "cartoon",
    uploadedAt: { $lt: thirtyDaysAgo },
  });
} 