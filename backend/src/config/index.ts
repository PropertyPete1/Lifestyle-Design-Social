import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - in production, env vars are set by platform
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

// Simple configuration object
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration (MongoDB)
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auto_posting_app',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  },

  // JWT configuration
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required for production');
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'real-estate-autopost',
    audience: process.env.JWT_AUDIENCE || 'real-estate-autopost-users',
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5001',
      'https://yourdomain.com',
    ],
  },

  // AI configuration
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    },
  },

  // Social platform configuration
  socialPlatforms: {
    instagram: {
      graphApiToken: process.env.INSTAGRAM_GRAPH_API_TOKEN_SAN_ANTONIO || '',
      graphApiTokenAustin: process.env.INSTAGRAM_GRAPH_API_TOKEN_AUSTIN || '',
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5001/api/auth/instagram/callback',
    },
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5001/api/auth/tiktok/callback',
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5001/api/auth/youtube/callback',
    },
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES?.split(',') || [
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/wmv',
      'video/webm',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
  },

  // Posting configuration
  posting: {
    optimalTimes: {
      twitter: process.env.OPTIMAL_TIMES_TWITTER?.split(',') || ['09:00', '12:00', '15:00', '18:00', '20:00'],
      instagram: process.env.OPTIMAL_TIMES_INSTAGRAM?.split(',') || ['08:00', '11:00', '14:00', '17:00', '19:00', '21:00'],
    },
    timezone: process.env.TIMEZONE || 'America/New_York',
  },

  // Feature flags
  features: {
    enableVideoProcessing: process.env.FEATURE_VIDEO_PROCESSING !== 'false',
    enableAICaptions: process.env.FEATURE_AI_CAPTIONS !== 'false',
    enableAnalytics: process.env.FEATURE_ANALYTICS !== 'false',
    enableNotifications: process.env.FEATURE_NOTIFICATIONS !== 'false',
    enableWebSocket: process.env.FEATURE_WEBSOCKET !== 'false',
    enableBackgroundJobs: process.env.FEATURE_BACKGROUND_JOBS !== 'false',
    enableRateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
    enableAuditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10), // 24 hours
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
  },
};

export default config; 