import { getMongoClient } from '../db/mongoClient';

export async function trackHashtags(caption: string, views: number) {
  const client = await getMongoClient();
  const db = client.db('autoposting');
  const collection = db.collection('hashtag_stats');

  const hashtags = caption.match(/#[\w]+/g) || [];

  for (const tag of hashtags) {
    await collection.updateOne(
      { tag },
      {
        $inc: {
          usage: 1,
          views: views,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
} 