// Standardized environment configuration for all projects
export interface StandardEnvironmentConfig {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database configuration
  DATABASE_URL?: string;
  DATABASE_PATH?: string;
  
  // JWT configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // API configuration
  API_URL: string;
  CORS_ORIGINS: string[];
  
  // Social Media APIs
  INSTAGRAM_CLIENT_ID?: string;
  INSTAGRAM_CLIENT_SECRET?: string;
  INSTAGRAM_REDIRECT_URI?: string;
  
  TIKTOK_CLIENT_ID?: string;
  TIKTOK_CLIENT_SECRET?: string;
  TIKTOK_REDIRECT_URI?: string;
  
  YOUTUBE_CLIENT_ID?: string;
  YOUTUBE_CLIENT_SECRET?: string;
  YOUTUBE_REDIRECT_URI?: string;
  
  // AI APIs
  OPENAI_API_KEY?: string;
  
  // File upload configuration
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
  
  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_CRON_JOBS: boolean;
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Parse environment variables with proper type conversion and validation
 */
export function parseEnvironmentConfig(): StandardEnvironmentConfig {
  const config: StandardEnvironmentConfig = {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    PORT: parseInt(process.env.PORT || '5001', 10),
    
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PATH: process.env.DATABASE_PATH || './data/app.db',
    
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    API_URL: process.env.API_URL || 'http://localhost:5001',
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_APP_ID,
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET,
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    
    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_KEY,
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
    
    YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI,
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
    ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
    ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS !== 'false',
    
    LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  };
  
  // Validate required fields
  validateEnvironmentConfig(config);
  
  return config;
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(config: StandardEnvironmentConfig): void {
  const errors: string[] = [];
  
  if (!config.JWT_SECRET || config.JWT_SECRET === 'your-secret-key-change-this-in-production') {
    errors.push('JWT_SECRET must be set to a secure value');
  }
  
  if (config.NODE_ENV === 'production') {
    if (!config.DATABASE_URL && !config.DATABASE_PATH) {
      errors.push('DATABASE_URL or DATABASE_PATH must be set in production');
    }
  }
  
  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  if (config.MAX_FILE_SIZE < 1024 * 1024) { // 1MB minimum
    errors.push('MAX_FILE_SIZE must be at least 1MB');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentDefaults(): Partial<StandardEnvironmentConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        LOG_LEVEL: 'info',
        ENABLE_ANALYTICS: true,
        ENABLE_NOTIFICATIONS: true,
        ENABLE_CRON_JOBS: true,
      };
    case 'test':
      return {
        LOG_LEVEL: 'error',
        ENABLE_ANALYTICS: false,
        ENABLE_NOTIFICATIONS: false,
        ENABLE_CRON_JOBS: false,
      };
    default: // development
      return {
        LOG_LEVEL: 'debug',
        ENABLE_ANALYTICS: true,
        ENABLE_NOTIFICATIONS: false,
        ENABLE_CRON_JOBS: true,
      };
  }
}

/**
 * Create a standardized .env template
 */
export function generateEnvTemplate(): string {
  return `# ========================================
# Real Estate Auto-Posting App - Environment Configuration
# ========================================

# Server Configuration
NODE_ENV=development
PORT=5001

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/autoposting
DATABASE_PATH=./data/app.db

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_URL=http://localhost:5001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Social Media APIs
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_REDIRECT_URI=http://localhost:5001/oauth/instagram/callback

TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=http://localhost:5001/oauth/tiktok/callback

YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:5001/oauth/youtube/callback

# AI APIs
OPENAI_API_KEY=your-openai-api-key

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_CRON_JOBS=true

# Logging Configuration
LOG_LEVEL=info
`;
}

// Export singleton instance
export const environmentConfig = parseEnvironmentConfig(); 