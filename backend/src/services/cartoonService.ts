import { db } from '../lib/mongo';

const collection = db.collection('cartoons');

export async function saveCartoonMetadata(metadata: {
  userId: string;
  prompt: string;
  aspectRatio: string;
  videoUrl: string;
}) {
  return await collection.insertOne({
    ...metadata,
    posted: false,
    createdAt: new Date(),
  });
}

export async function getCartoonQueue(userId: string) {
  return await collection
    .find({ userId, posted: false })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function markCartoonAsPosted(id: string) {
  return await collection.updateOne(
    { _id: new (require('mongodb').ObjectId)(id) },
    { $set: { posted: true } }
  );
}

export async function deleteCartoonById(id: string) {
  return await collection.deleteOne({
    _id: new (require('mongodb').ObjectId)(id),
  });
} 