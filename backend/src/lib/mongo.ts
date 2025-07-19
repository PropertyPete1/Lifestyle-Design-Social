import { MongoClient } from 'mongodb';

const uri = process.env['MONGODB_URI']!;
const client = new MongoClient(uri);
export const db = client.db();

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
} 