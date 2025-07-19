import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('⚠️ MONGODB_URI not found in environment. Backend will not connect to DB.');
}

const client = uri ? new MongoClient(uri) : null;

export async function getDb() {
  if (!client) {
    throw new Error('MongoDB client not initialized. Check MONGODB_URI.');
  }
  try {
    await client.connect();
  } catch (error) {
    // Client might already be connected
  }
  return client.db('lifestyle-design');
} 