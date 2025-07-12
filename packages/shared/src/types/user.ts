// ========================================
// User Types & Interfaces
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  postingSchedule: PostingScheduleSettings;
  notifications: NotificationSettings;
  content: ContentSettings;
  privacy: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostingScheduleSettings {
  enabled: boolean;
  postsPerDay: number;
  preferredTimes: string[]; // ['09:00', '14:00', '19:00']
  timezone: string;
  daysOfWeek: number[]; // [1,2,3,4,5] for weekdays
  spacingHours: number; // Minimum hours between posts
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  postSuccess: boolean;
  postFailure: boolean;
  lowContent: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface ContentSettings {
  autoGenerateCaptions: boolean;
  useTrendingHashtags: boolean;
  includeLocation: boolean;
  watermark: boolean;
  musicPreference: MusicPreference;
  captionTone: CaptionTone;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  shareAnalytics: boolean;
  marketingEmails: boolean;
}

// ========================================
// Enums
// ========================================

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum MusicPreference {
  UPBEAT = 'upbeat',
  CALM = 'calm',
  DRAMATIC = 'dramatic',
  FUNNY = 'funny',
  TRENDING = 'trending'
}

export enum CaptionTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FUNNY = 'funny',
  INSPIRATIONAL = 'inspirational',
  URGENT = 'urgent'
}

// ========================================
// Authentication Types
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  company?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
}

// ========================================
// User Profile Types
// ========================================

export interface UserProfile extends User {
  settings: UserSettings;
  platformConnections: PlatformConnection[];
  subscription: SubscriptionDetails;
  usage: UsageStats;
}

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  isActive: boolean;
  scopes: string[];
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  customerId?: string; // Stripe customer ID
  subscriptionId?: string; // Stripe subscription ID
}

export interface UsageStats {
  videosUploaded: number;
  postsScheduled: number;
  postsPublished: number;
  storageUsed: number; // in bytes
  apiCallsUsed: number;
  periodStart: Date;
  periodEnd: Date;
}

// ========================================
// Platform Types
// ========================================

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing'
}

// ========================================
// API Response Types
// ========================================

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination?: PaginationInfo;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ========================================
// Validation Schemas (for use with Zod)
// ========================================

export const userValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters'
  },
  company: {
    required: false,
    maxLength: 200,
    message: 'Company name cannot exceed 200 characters'
  },
  phone: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]{10,}$/,
    message: 'Please enter a valid phone number'
  }
};

// ========================================
// Helper Types
// ========================================

export type UserWithoutPassword = Omit<User, 'password'>;
export type UserUpdate = Partial<UpdateUserInput>;
export type UserCreate = CreateUserInput;

// For form handling
export interface UserFormData {
  email: string;
  name: string;
  company: string;
  phone: string;
}

export interface UserSettingsFormData {
  postingSchedule: PostingScheduleSettings;
  notifications: NotificationSettings;
  content: ContentSettings;
  privacy: PrivacySettings;
}

// ========================================
// Utility Types
// ========================================

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  churnRate: number;
  averageSessionDuration: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export default User; 