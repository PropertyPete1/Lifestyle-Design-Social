import { db } from '../../db/mongoClient';

export async function getBestCaptions(limit = 3) {
  const collection = db.collection('captions');
  
  const bestCaptions = await collection
    .find({})
    .sort({ performanceScore: -1, timestamp: -1 })
    .limit(limit)
    .toArray();

  return bestCaptions.map((caption: any) => ({
    id: caption._id,
    text: caption.captionText || caption.caption || caption.text,
    score: caption.performanceScore || caption.engagement || 0,
    timestamp: caption.timestamp || caption.createdAt
  }));
} 