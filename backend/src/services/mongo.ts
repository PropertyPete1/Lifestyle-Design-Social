import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Try to load from settings.json (used by the app's settings UI)
const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
let mongoDbUri = process.env.MONGODB_URI || '';

if (!mongoDbUri && fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    mongoDbUri = settings.mongoDbUri || '';
  } catch (e) {
    console.error('Failed to read MongoDB URI from settings.json:', e);
  }
}

if (!mongoDbUri) {
  throw new Error('MongoDB URI not set in environment or settings.json');
}

export function connectMongo() {
  return mongoose.connect(mongoDbUri);
} 