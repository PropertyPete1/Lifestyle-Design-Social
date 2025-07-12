import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple configuration object
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'real_estate_auto_posting',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
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
      'https://yourdomain.com',
    ],
  },

  // AI configuration
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    },
  },

  // Social platform configuration
  socialPlatforms: {
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3001/api/auth/instagram/callback',
      scopes: process.env.INSTAGRAM_SCOPES?.split(',') || [
        'user_profile',
        'user_media',
        'instagram_basic',
        'instagram_content_publish',
      ],
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3001/api/auth/tiktok/callback',
      scopes: process.env.TIKTOK_SCOPES?.split(',') || [
        'user.info.basic',
        'video.list',
        'video.upload',
        'video.publish',
      ],
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3001/api/auth/youtube/callback',
      scopes: process.env.YOUTUBE_SCOPES?.split(',') || [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
      ],
    },
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '104857600', 10), // 100MB
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
    destination: process.env.UPLOAD_DESTINATION || 'uploads',
    enableVirusScan: process.env.UPLOAD_ENABLE_VIRUS_SCAN === 'true',
  },

  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'ses',
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    replyToEmail: process.env.EMAIL_REPLY_TO || 'support@yourdomain.com',
  },

  // AWS configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'real-estate-autopost-uploads',
      cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || undefined,
    },
    ses: {
      fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@yourdomain.com',
      replyToEmail: process.env.AWS_SES_REPLY_TO_EMAIL || 'support@yourdomain.com',
    },
  },

  // Stripe configuration
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    products: {
      free: process.env.STRIPE_PRODUCT_FREE || '',
      basic: process.env.STRIPE_PRODUCT_BASIC || '',
      pro: process.env.STRIPE_PRODUCT_PRO || '',
      enterprise: process.env.STRIPE_PRODUCT_ENTERPRISE || '',
    },
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