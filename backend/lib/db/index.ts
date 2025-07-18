// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • It exports a helper to get the MongoDB collection.

import clientPromise from '@/lib/mongo';

export async function getCollection<T = any>(collectionName: string) {
  const client = await clientPromise;
  const db = client.db(); // Uses default DB from URI
  return db.collection<T>(collectionName);
} 