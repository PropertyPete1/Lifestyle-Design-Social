import { db } from '../lib/db/mongoClient';

export async function logViewerActivity(userId: string, timestamp: Date) {
  const collection = db.collection('viewer_activity');
  await collection.insertOne({ userId, timestamp });
} 