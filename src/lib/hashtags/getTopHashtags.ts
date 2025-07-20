import { getMongoClient } from '../db/mongoClient';

export async function getTopHashtags(limit = 10) {
  const client = await getMongoClient();
  const db = client.db('autoposting');
  const collection = db.collection('hashtag_stats');

  return await collection
    .aggregate([
      {
        $project: {
          tag: 1,
          avgViews: { $divide: ['$views', '$usage'] },
        },
      },
      { $sort: { avgViews: -1 } },
      { $limit: limit },
    ])
    .toArray();
} 