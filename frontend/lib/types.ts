// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'premium';
  subscription?: SubscriptionPlan;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  autoPostingEnabled: boolean;
  postingTimes: string[];
  pinnedHours: string[];
  excludedHours: string[];
  testMode: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  postSuccess: boolean;
  postFailure: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showAnalytics: boolean;
  allowDataCollection: boolean;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'basic' | 'pro' | 'enterprise';
  price: number;
  interval: 'monthly' | 'yearly';
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionFeatures {
  videoUploads: boolean;
  aiCaptions: boolean;
  multiPlatform: boolean;
  analytics: boolean;
  scheduling: boolean;
  bulkOperations: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionLimits {
  videosPerMonth: number;
  postsPerMonth: number;
  storageGB: number;
  platforms: number;
  teamMembers: number;
  apiCallsPerMonth: number;
}

// Video Types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration: number;
  resolution: VideoResolution;
  thumbnailPath?: string;
  hasAudio: boolean;
  category: VideoCategory;
  tags: string[];
  metadata: VideoMetadata;
  processingStatus: ProcessingStatus;
  aiAnalysis?: AIAnalysis;
  postCount: number;
  lastPostedAt?: string;
  nextPostDate?: string;
  isActive: boolean;
  coolOffDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoResolution {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface VideoMetadata {
  codec: string;
  bitrate: number;
  fps: number;
  colorSpace: string;
  audioCodec?: string;
  audioBitrate?: number;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface AIAnalysis {
  viralScore: number;
  engagementPrediction: number;
  contentType: string;
  emotions: string[];
  objects: string[];
  scenes: string[];
  qualityScore: number;
  thumbnailSuggestions: ThumbnailSuggestion[];
}

export interface ThumbnailSuggestion {
  timestamp: number;
  score: number;
  reason: string;
  path: string;
}

export type VideoCategory = 'real-estate' | 'cartoon' | 'educational' | 'promotional' | 'testimonial';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Post Types
export interface Post {
  id: string;
  userId: string;
  videoId: string;
  platform: SocialPlatform;
  content: PostContent;
  status: PostStatus;
  scheduledTime: string;
  postedTime?: string;
  engagementMetrics?: EngagementMetrics;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostContent {
  caption: string;
  hashtags: string[];
  mentions: string[];
  location?: Location;
  music?: Music;
  thumbnail?: string;
  customFields?: Record<string, any>;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface Music {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail?: string;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  clickThroughRate?: number;
  profileVisits?: number;
  websiteClicks?: number;
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
export type PostStatus = 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';

// Analytics Types
export interface Analytics {
  id: string;
  userId: string;
  postId?: string;
  platform: SocialPlatform;
  date: string;
  metrics: AnalyticsMetrics;
  demographics?: Demographics;
  insights?: Insights;
  createdAt: string;
}

export interface AnalyticsMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  saves: number;
  shares: number;
  comments: number;
  likes: number;
  views: number;
  profileVisits: number;
  websiteClicks: number;
  emailSignups: number;
  phoneClicks: number;
  directionsClicks: number;
}

export interface Demographics {
  ageGroups: Record<string, number>;
  genders: Record<string, number>;
  locations: Record<string, number>;
  interests: Record<string, number>;
  devices: Record<string, number>;
}

export interface Insights {
  bestPostingTimes: string[];
  topPerformingContent: string[];
  audienceGrowth: number;
  engagementTrends: EngagementTrend[];
  hashtagPerformance: HashtagPerformance[];
  competitorAnalysis?: CompetitorAnalysis;
}

export interface EngagementTrend {
  date: string;
  engagement: number;
  reach: number;
  impressions: number;
}

export interface HashtagPerformance {
  hashtag: string;
  usage: number;
  avgEngagement: number;
  reach: number;
  trending: boolean;
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  benchmarks: Benchmark[];
  opportunities: string[];
}

export interface Competitor {
  username: string;
  followers: number;
  avgEngagement: number;
  postFrequency: number;
  topHashtags: string[];
}

export interface Benchmark {
  metric: string;
  userValue: number;
  industryAverage: number;
  percentile: number;
}

// Social Platform Connection Types
export interface SocialPlatformConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  displayName: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes: string[];
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus: SyncStatus;
  accountType: AccountType;
  businessInfo?: BusinessInfo;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInfo {
  businessId: string;
  businessName: string;
  category: string;
  website?: string;
  phone?: string;
  address?: string;
  verified: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'pending';
export type AccountType = 'personal' | 'business' | 'creator';

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VideoUploadForm {
  title: string;
  description?: string;
  category: VideoCategory;
  tags: string[];
  file: File;
}

export interface PostScheduleForm {
  videoId: string;
  platforms: SocialPlatform[];
  caption: string;
  hashtags: string[];
  scheduledTime: string;
}

// Dashboard Types
export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  successRate: string;
  totalEngagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  averageEngagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  badge?: number;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 