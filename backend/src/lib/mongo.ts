// 🛠️ Instructions:
// Create or replace this file at the exact path above.
// This file safely connects to MongoDB using the URI from your .env.local file.

import { MongoClient, Db } from 'mongodb';

let db: Db;

export async function connectToMongo(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment');
  }

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('lifestyledesign'); // 👈 name your DB anything here
  return db;
} 