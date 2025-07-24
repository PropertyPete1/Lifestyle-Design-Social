import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import indexRouter from './src/routes/index';
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

export default app;
