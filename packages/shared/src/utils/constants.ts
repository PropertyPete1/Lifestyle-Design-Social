// Application constants
export const APP_NAME = 'Real Estate Auto-Posting App';
export const APP_VERSION = '1.0.0';

// API constants
export const API_ENDPOINTS = {
  AUTH: '/auth',
  VIDEOS: '/videos',
  POSTS: '/posts',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  OAUTH: '/oauth',
  LEGAL: '/legal',
} as const;

// Social platform constants
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
} as const;

// Video constants
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DURATION: 300, // 5 minutes
  SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'mkv'],
  THUMBNAIL_SIZE: { width: 320, height: 180 },
} as const;

// Post status constants
export const POST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  POSTING: 'posting',
  POSTED: 'posted',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// UI constants
export const THEME = {
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#6c757d',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    ERROR: '#dc3545',
    INFO: '#17a2b8',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{10,}$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const; 