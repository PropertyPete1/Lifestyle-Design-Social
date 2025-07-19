import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env.local');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
} 