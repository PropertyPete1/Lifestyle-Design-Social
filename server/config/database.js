const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

const connectDB = async () => {
  try {
    const dbPath = path.join(__dirname, '../../data/app.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite connection error:', err.message);
        process.exit(1);
      } else {
        console.log('✅ SQLite Connected');
        initializeTables();
        // Run migrations after tables are initialized
        const { runMigrations } = require('./migrations');
        runMigrations();
      }
    });
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const initializeTables = () => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    autoPostingEnabled BOOLEAN DEFAULT 0,
    cameraRollPath TEXT,
    postingTimes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Videos table - Updated with missing columns
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    title TEXT,
    description TEXT,
    filePath TEXT,
    fileName TEXT,
    fileSize INTEGER,
    duration REAL,
    resolution TEXT,
    hasAudio BOOLEAN,
    category TEXT,
    propertyType TEXT,
    location TEXT,
    price REAL,
    tags TEXT,
    aiScore REAL DEFAULT 0,
    status TEXT DEFAULT 'processing',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  // Posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    videoId INTEGER,
    platform TEXT,
    content TEXT,
    hashtags TEXT,
    scheduledTime DATETIME,
    postedTime DATETIME,
    status TEXT DEFAULT 'scheduled',
    engagement TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (videoId) REFERENCES videos (id)
  )`);

  // Social accounts table
  db.run(`CREATE TABLE IF NOT EXISTS social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    platform TEXT,
    username TEXT,
    accessToken TEXT,
    refreshToken TEXT,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  // API keys table - CRITICAL: This was missing!
  db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    keyName TEXT NOT NULL,
    keyValue TEXT NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    UNIQUE(userId, keyName)
  )`);

  // Analytics table
  db.run(`CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    postId INTEGER,
    platform TEXT,
    metric TEXT,
    value REAL,
    date DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (postId) REFERENCES posts (id)
  )`);

  // Instagram learning data table
  db.run(`CREATE TABLE IF NOT EXISTS instagram_learning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    postId TEXT,
    caption TEXT,
    hashtags TEXT,
    engagement TEXT,
    approval TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  console.log('✅ Database tables initialized');
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { connectDB, getDB }; 