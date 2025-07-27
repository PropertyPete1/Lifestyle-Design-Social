import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    // Load MongoDB URI from backend settings.json or environment
    const settingsPath = path.resolve(__dirname, '../../settings.json');
    const backupSettingsPath = path.resolve(__dirname, '../../../settings.json');
    let mongoUri = process.env.MONGODB_URI;

    // Try backend/settings.json first, then root settings.json
    const pathsToCheck = [settingsPath, backupSettingsPath];
    
    for (const settingsFile of pathsToCheck) {
      if (fs.existsSync(settingsFile)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
          mongoUri = settings.mongoUri || settings.mongoDbUri || mongoUri;
          if (mongoUri) break;
        } catch (e) {
          // Ignore parse errors and try next file
        }
      }
    }

    if (!mongoUri) {
      // Use default local MongoDB if no URI provided
      mongoUri = 'mongodb://localhost:27017/lifestyle-design-auto-poster';
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      maxPoolSize: 10
    });
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