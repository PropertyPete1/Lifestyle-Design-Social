// ✅ File path: backend/lib/mongo.ts
// 🛠️ Instructions:
// • This version logs an error if MONGODB_URI is missing
// • Helps you debug where it's going wrong

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // 👈 Points to .env at project root

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is missing. Did you load the right .env file?');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
} 