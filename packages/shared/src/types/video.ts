// ========================================
// Video Types & Interfaces
// ========================================

// Video interface removed to avoid duplication with UnifiedVideo
// Use UnifiedVideo from packages/shared/src/types/unified.ts instead
import { UnifiedVideo } from './unified';

// Type alias for backwards compatibility
export type Video = UnifiedVideo;

export interface CreateVideoInput {
  title: string;
  description?: string;
  file: File | Buffer;
  category: VideoCategory;
  tags?: string[];
  thumbnail?: File | Buffer;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  category?: VideoCategory;
  tags?: string[];
  isActive?: boolean;
  thumbnail?: File | Buffer;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  aspectRatio: string; // '16:9', '9:16', '1:1'
  framerate: number;
  fps: number; // alias for framerate for compatibility
  bitrate: number;
  codec: string;
  hasAudio: boolean;
  audioCodec?: string;
  audioBitrate?: number;
  colorSpace?: string;
  format: string;
  fileSize: number;
  // Camera roll specific properties
  orientation?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo?: {
    make: string;
    model: string;
    os: string;
  };
  tags?: string[];
  isVertical?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export interface VideoProcessingStatus {
  status: ProcessingStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  thumbnailGenerated: boolean;
  compressionApplied: boolean;
  formatOptimized: boolean;
}

export interface VideoOptimization {
  aiScore: number; // 0-10 rating for posting potential
  viralElements: ViralElement[];
  suggestedCaptions: string[];
  suggestedHashtags: string[];
  suggestedMusic: MusicSuggestion[];
  bestPostingTimes: string[];
  platformOptimization: PlatformOptimization[];
  engagementPrediction: EngagementPrediction;
}

export interface ViralElement {
  type: ViralElementType;
  confidence: number; // 0-1
  timestamp?: number; // seconds into video
  description: string;
}

export interface MusicSuggestion {
  title: string;
  artist: string;
  genre: string;
  mood: MusicMood;
  duration: number;
  url?: string;
  royaltyFree: boolean;
}

export interface PlatformOptimization {
  platform: SocialPlatform;
  score: number; // 0-10
  recommendations: string[];
  optimalDimensions: {
    width: number;
    height: number;
  };
  maxDuration: number;
  requiredAspectRatio: string;
}

export interface EngagementPrediction {
  expectedViews: number;
  expectedLikes: number;
  expectedComments: number;
  expectedShares: number;
  confidence: number; // 0-1
  factors: string[];
}

// ========================================
// Video Library & Management
// ========================================

export interface VideoLibrary {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  videoCount: number;
  totalDuration: number;
  totalSize: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCollection {
  id: string;
  userId: string;
  libraryId: string;
  name: string;
  videos: Video[];
  autoAddRules: AutoAddRule[];
  sortOrder: SortOrder;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoAddRule {
  field: 'tags' | 'category' | 'title' | 'description';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  value: string;
}

export interface VideoTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: VideoCategory;
  defaultTags: string[];
  captionTemplate: string;
  hashtagTemplate: string[];
  musicPreference: MusicMood;
  platformSettings: PlatformVideoSettings[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformVideoSettings {
  platform: SocialPlatform;
  enabled: boolean;
  captionOverride?: string;
  hashtagOverride?: string[];
  scheduleOverride?: PostingSchedule;
}

// ========================================
// Video Processing & Upload
// ========================================

export interface VideoUploadSession {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadUrl: string;
  status: UploadStatus;
  progress: number;
  chunksUploaded: number;
  totalChunks: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface VideoProcessingJob {
  id: string;
  videoId: string;
  userId: string;
  type: ProcessingJobType;
  status: ProcessingStatus;
  priority: JobPriority;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  analysisType: AnalysisType;
  result: any;
  confidence: number;
  processingTime: number; // milliseconds
  createdAt: Date;
}

// ========================================
// Enums
// ========================================

export enum VideoCategory {
  REAL_ESTATE = 'real-estate',
  PROPERTY_TOUR = 'property-tour',
  MARKET_UPDATE = 'market-update',
  TIPS_ADVICE = 'tips-advice',
  CARTOON = 'cartoon',
  TESTIMONIAL = 'testimonial',
  BEHIND_SCENES = 'behind-scenes',
  EDUCATIONAL = 'educational',
  PROMOTIONAL = 'promotional'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ViralElementType {
  FACE_DETECTION = 'face_detection',
  EMOTION_PEAKS = 'emotion_peaks',
  MOTION_CHANGES = 'motion_changes',
  TEXT_OVERLAYS = 'text_overlays',
  BRIGHT_COLORS = 'bright_colors',
  QUICK_CUTS = 'quick_cuts',
  TRENDING_OBJECTS = 'trending_objects'
}

export enum MusicMood {
  UPBEAT = 'upbeat',
  CALM = 'calm',
  DRAMATIC = 'dramatic',
  FUNNY = 'funny',
  INSPIRATIONAL = 'inspirational',
  ENERGETIC = 'energetic',
  ROMANTIC = 'romantic',
  SUSPENSEFUL = 'suspenseful'
}

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

export enum SortOrder {
  NEWEST_FIRST = 'newest_first',
  OLDEST_FIRST = 'oldest_first',
  MOST_POSTED = 'most_posted',
  LEAST_POSTED = 'least_posted',
  HIGHEST_SCORE = 'highest_score',
  LONGEST_DURATION = 'longest_duration',
  SHORTEST_DURATION = 'shortest_duration'
}

export enum ProcessingJobType {
  THUMBNAIL_GENERATION = 'thumbnail_generation',
  VIDEO_COMPRESSION = 'video_compression',
  FORMAT_CONVERSION = 'format_conversion',
  AI_ANALYSIS = 'ai_analysis',
  VIRAL_OPTIMIZATION = 'viral_optimization',
  CAPTION_GENERATION = 'caption_generation',
  HASHTAG_SUGGESTION = 'hashtag_suggestion',
  MUSIC_MATCHING = 'music_matching'
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

export enum AnalysisType {
  OBJECT_DETECTION = 'object_detection',
  SCENE_CLASSIFICATION = 'scene_classification',
  EMOTION_ANALYSIS = 'emotion_analysis',
  TEXT_RECOGNITION = 'text_recognition',
  AUDIO_ANALYSIS = 'audio_analysis',
  ENGAGEMENT_PREDICTION = 'engagement_prediction'
}

// ========================================
// API Response Types
// ========================================

export interface VideoResponse {
  success: boolean;
  data: Video;
  message?: string;
}

export interface VideosResponse {
  success: boolean;
  data: Video[];
  pagination?: PaginationInfo;
  filters?: VideoFilters;
  message?: string;
}

export interface VideoUploadResponse {
  success: boolean;
  data: {
    uploadSession: VideoUploadSession;
    uploadUrl: string;
  };
  message?: string;
}

export interface VideoProcessingResponse {
  success: boolean;
  data: {
    job: VideoProcessingJob;
    estimatedTime: number; // seconds
  };
  message?: string;
}

// ========================================
// Filtering & Search
// ========================================

export interface VideoFilters {
  category?: VideoCategory;
  tags?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  fileSize?: {
    min?: number;
    max?: number;
  };
  postCount?: {
    min?: number;
    max?: number;
  };
  aiScore?: {
    min?: number;
    max?: number;
  };
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastPostedAfter?: Date;
  lastPostedBefore?: Date;
}

export interface VideoSearchQuery {
  query?: string;
  filters?: VideoFilters;
  sortBy?: keyof Video;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
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
// Video Statistics & Analytics
// ========================================

export interface VideoStats {
  totalVideos: number;
  totalDuration: number; // seconds
  totalSize: number; // bytes
  averageDuration: number;
  averageSize: number;
  averageAiScore: number;
  categoryBreakdown: CategoryStats[];
  uploadTrend: UploadTrendData[];
  performanceMetrics: VideoPerformanceMetrics;
}

export interface CategoryStats {
  category: VideoCategory;
  count: number;
  percentage: number;
  averageScore: number;
  averagePostCount: number;
}

export interface UploadTrendData {
  date: string;
  count: number;
  totalSize: number;
  averageScore: number;
}

export interface VideoPerformanceMetrics {
  topPerformingVideos: Video[];
  underperformingVideos: Video[];
  averagePostsPerVideo: number;
  repostingRate: number;
  retentionScore: number;
}

// ========================================
// Helper Types
// ========================================

export type VideoWithoutFile = Omit<Video, 'file'>;
export type VideoUpdate = Partial<UpdateVideoInput>;
export type VideoCreate = CreateVideoInput;

// For form handling
export interface VideoFormData {
  title: string;
  description: string;
  category: VideoCategory;
  tags: string[];
  file?: File;
  thumbnail?: File;
}

// ========================================
// Utility Functions Types
// ========================================

export interface VideoUtilities {
  generateThumbnail: (videoUrl: string, timestamp?: number) => Promise<string>;
  compressVideo: (videoUrl: string, quality: 'low' | 'medium' | 'high') => Promise<string>;
  extractMetadata: (videoUrl: string) => Promise<VideoMetadata>;
  analyzeContent: (videoUrl: string) => Promise<VideoOptimization>;
  validateVideo: (file: File) => Promise<VideoValidationResult>;
}

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Partial<VideoMetadata>;
}

export interface PostingSchedule {
  times: string[];
  timezone: string;
  daysOfWeek: number[];
}

export default Video; 