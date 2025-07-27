import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import indexRouter from './src/routes/index';
import phase9Router from './src/routes/api/phase9';
import { initializeScheduledJobs } from './src/lib/youtube/schedulePostJob';
import { migrateFilePaths } from './src/lib/youtube/migrateFilePaths';
import { startDropboxMonitoring } from './src/services/dropboxMonitor';
import { repostMonitor } from './src/services/repostMonitor';
import { audioMatchingScheduler } from './src/services/audioMatchingScheduler';
import { peakHoursScheduler } from './src/lib/peakHours/scheduler';
import { smartRepostTrigger } from './src/lib/repost/smartRepostTrigger';
import { phase9Monitor } from './src/services/phase9Monitor';
import * as fs from 'fs';

const app = express();

// Load API keys from settings.json if present
const settingsPath = path.resolve(__dirname, '../frontend/settings.json');
if (fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    for (const [key, value] of Object.entries(settings)) {
      if (value && !process.env[key]) {
        process.env[key] = String(value);
      }
    }
  } catch (e) {
    // Ignore parse errors, fallback to .env
  }
}

// CORS for all routes and preflight
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Explicitly handle preflight for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/phase9', phase9Router);

// Run migration and initialize scheduled jobs on server start
(async () => {
  try {
    // Import here to avoid circular dependency
    const { connectToDatabase } = await import('./src/database/connection');
    
    // Connect to database first
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    
    console.log('🔄 Running migrations...');
    await migrateFilePaths();
    
    console.log('⏰ Initializing scheduled jobs...');
    await initializeScheduledJobs();
    
    console.log('📁 Starting Dropbox monitoring...');
    startDropboxMonitoring();
    
    // Start repost monitoring (Phase 2)
    console.log('🎯 Starting repost monitoring...');
    repostMonitor.startMonitoring(60); // Check every hour
    
    // Start audio matching scheduler (Phase 3)
    console.log('🎵 Starting audio matching scheduler...');
    audioMatchingScheduler.start();
    
    // Start peak hours scheduler (Phase 6)
    console.log('🕒 Starting peak hours scheduler...');
    peakHoursScheduler.startScheduler();
    
    // Start smart repost trigger (Phase 7)
    console.log('🔄 Starting smart repost trigger...');
    smartRepostTrigger.startTrigger();
    
    // Start Phase 9 intelligent content repurposing monitor
    console.log('🤖 Starting Phase 9 intelligent content repurposing...');
    await phase9Monitor.start();
    
    console.log('🚀 Backend fully initialized with ALL PHASES (1-9) complete');
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
  }
})();

export default app;
