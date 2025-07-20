import { db } from './mongoClient';

export async function saveCaptions(captions: string[]) {
  const collection = db.collection('captions');

  const documents = captions.map(caption => ({
    caption,
    createdAt: new Date(),
  }));

  await collection.insertMany(documents);
}

export async function getTopCaptions(limit = 10): Promise<string[]> {
  const collection = db.collection('captions');

  const results = await collection.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return results.map((doc: any) => doc.caption);
} 