import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifestyle-design-auto-poster-v2';

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      maxPoolSize: 10
    });
    
    isConnected = true;
    console.log('✅ Connected to MongoDB:', mongoUri.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ Disconnected from MongoDB');
  }
}