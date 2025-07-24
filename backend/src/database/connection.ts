import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    // Load MongoDB URI from settings.json or environment
    const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
    let mongoUri = process.env.MONGODB_URI;

    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        mongoUri = settings.mongoDbUri || mongoUri;
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (!mongoUri) {
      // Use default local MongoDB if no URI provided
      mongoUri = 'mongodb://localhost:27017/lifestyle-design-auto-poster';
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Connected to MongoDB:', mongoUri.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
} 