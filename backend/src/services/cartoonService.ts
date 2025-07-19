// 🛠️ Instructions:
// Create or replace this file at the exact path above.
// This file connects to MongoDB and safely saves or fetches cartoon video records.

import { connectToMongo } from '../lib/mongo';

export async function saveCartoonVideo(videoData: any) {
  const db = await connectToMongo();
  const collection = db.collection('cartoonVideos');
  const result = await collection.insertOne(videoData);
  return result.insertedId;
}

export async function getAllCartoonVideos() {
  const db = await connectToMongo();
  const collection = db.collection('cartoonVideos');
  const videos = await collection.find({}).toArray();
  return videos;
} 