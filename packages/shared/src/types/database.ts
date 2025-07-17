// Comprehensive database types matching actual schema
export interface DatabaseUser {
  id: number;
  email: string;
  password: string;
  name?: string;
  username?: string;
  autoPostingEnabled: boolean;
  cameraRollPath?: string;
  postingTimes?: string; // JSON string
  createdAt: string;
}

export interface DatabaseVideo {
  id: number;
  userId: number;
  title?: string;
  description?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  resolution?: string;
  hasAudio?: boolean;
  category?: string;
  propertyType?: string;
  location?: string;
  price?: number;
  tags?: string; // JSON string
  aiScore?: number;
  status: string;
  postCount: number;
  lastPosted?: string;
  isActive: boolean;
  nextPostDate?: string;
  preferredCaption?: string;
  preferredHashtags?: string;
  preferredMusic?: string;
  coolOffDays: number;
  thumbnailPath?: string;
  createdAt: string;
}

export interface DatabasePost {
  id: number;
  userId: number;
  videoId: number;
  platform?: string;
  content?: string;
  hashtags?: string;
  scheduledTime?: string;
  postedTime?: string;
  status: string;
  engagement?: string;
  engagementRate?: number;
  impressions?: number;
  reach?: number;
  createdAt: string;
}

export interface DatabaseSocialAccount {
  id: number;
  userId: number;
  platform?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  isActive: boolean;
  lastSync?: string;
  syncStatus?: string;
  createdAt: string;
}

export interface DatabaseAPIKey {
  id: number;
  userId: number;
  keyName: string;
  keyValue: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseAnalytics {
  id: number;
  userId: number;
  postId: number;
  platform?: string;
  metric?: string;
  value?: number;
  date?: string;
  createdAt: string;
}

export interface DatabaseInstagramLearning {
  id: number;
  user_id: number;
  post_id?: string;
  caption?: string;
  hashtags?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  engagement_data?: string;
  engagement_rate?: number;
  is_high_performing: boolean;
  created_at: string;
}

export interface DatabaseUserInsights {
  id: number;
  user_id: number;
  insights_data?: string;
  updated_at: string;
}

export interface DatabaseScheduledPost {
  id: number;
  user_id: number;
  video_id: number;
  platform?: string;
  video_type?: string;
  scheduled_time?: string;
  caption?: string;
  hashtags?: string;
  status: string;
  retry_count: number;
  created_at: string;
  posted_at?: string;
  engagement_data?: string;
}

export interface DatabaseVideoCooldown {
  id: number;
  video_id: number;
  post_count: number;
  last_posted?: string;
  cooldown_until?: string;
  priority: number;
  updated_at: string;
}

export interface DatabaseHashtagLibrary {
  id: number;
  user_id: number;
  category?: string;
  hashtags?: string;
  performance_data?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTrendingHashtag {
  id: number;
  hashtag?: string;
  platform?: string;
  trending_score?: number;
  category?: string;
  fetched_at?: string;
  expires_at?: string;
}

export interface DatabaseHashtagPerformance {
  id: number;
  user_id: number;
  hashtag?: string;
  total_uses: number;
  total_engagement: number;
  average_engagement: number;
  last_used?: string;
}

export interface DatabaseCaptionGeneration {
  id: number;
  user_id: number;
  video_id: number;
  platform?: string;
  caption?: string;
  hashtags?: string;
  confidence?: number;
  source?: string;
  original_caption?: string;
  engagement_score?: number;
  created_at: string;
}

export interface DatabaseTikTokUserInfo {
  id: number;
  user_id: number;
  open_id?: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  is_verified: boolean;
  updated_at: string;
}

export interface DatabaseYouTubeChannelInfo {
  id: number;
  user_id: number;
  channel_id?: string;
  channel_title?: string;
  description?: string;
  thumbnail_url?: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  is_verified: boolean;
  keywords?: string;
  updated_at: string;
}

export interface DatabaseMultiPlatformPost {
  id: number;
  user_id: number;
  video_id: number;
  video_type?: string;
  platforms?: string;
  scheduled_time?: string;
  total_platforms?: number;
  successful_platforms?: number;
  failed_platforms?: number;
  results_data?: string;
  created_at: string;
}

export interface DatabaseVideoIntelligenceAnalysis {
  id: number;
  video_id: number;
  scene_analysis?: string;
  audio_analysis?: string;
  thumbnail_options?: string;
  music_recommendations?: string;
  engagement_prediction?: string;
  optimization_suggestions?: string;
  analyzed_at: string;
}

export interface DatabaseThumbnailSelection {
  id: number;
  video_id: number;
  thumbnail_path?: string;
  timestamp?: number;
  score?: number;
  face_count: number;
  text_present: boolean;
  color_score?: number;
  composition_score?: number;
  engagement_prediction?: number;
  reasoning?: string;
  is_selected: boolean;
  created_at: string;
}

export interface DatabaseMusicMatch {
  id: number;
  video_id: number;
  track_id?: string;
  track_name?: string;
  artist?: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  popularity?: number;
  trending_score?: number;
  match_score?: number;
  preview_url?: string;
  platform?: string;
  is_selected: boolean;
  created_at: string;
}

export interface DatabaseAudioAnalysis {
  id: number;
  video_id: number;
  has_audio?: boolean;
  audio_quality?: string;
  mood?: string;
  tempo?: number;
  volume?: number;
  background_noise?: number;
  speech_detected: boolean;
  music_detected: boolean;
  recommended_genres?: string;
  analyzed_at: string;
}

export interface DatabaseVideoOptimizationHistory {
  id: number;
  video_id: number;
  optimization_type?: string;
  before_value?: number;
  after_value?: number;
  improvement_percentage?: number;
  applied_at: string;
}

export interface DatabaseEngagementAnalytics {
  id: number;
  platform: string;
  hour: number;
  date: string;
  engagement_score: number;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_views: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDynamicSchedule {
  id: number;
  instagram_times: string;
  tiktok_times: string;
  youtube_times: string;
  last_updated: string;
  confidence_score: number;
  data_points: number;
  created_at: string;
}

export interface DatabaseAudienceActivityPattern {
  id: number;
  user_id: number;
  platform: string;
  hour: number;
  day_of_week: number;
  activity_score: number;
  engagement_rate: number;
  sample_size: number;
  last_updated: string;
}

export interface DatabasePlatformOptimalTimes {
  id: number;
  platform: string;
  optimal_times: string;
  confidence_score: number;
  data_points: number;
  last_calculated: string;
  expires_at: string;
}

export interface DatabaseAPIHealthLog {
  id: number;
  platform: string;
  status: string;
  error_message?: string;
  response_time?: number;
  created_at: string;
}

export interface DatabaseMigration {
  id: number;
  version: number;
  name: string;
  description?: string;
  executed_at: string;
  checksum: string;
}

// Query result interfaces
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface QueryResultSingle<T> {
  success: boolean;
  data?: T;
  error?: string;
  lastID?: number;
  changes?: number;
}

// Database connection interface
export interface DatabaseConnection {
  query<T = Record<string, unknown>>(sql: string, params?: (string | number | boolean | null)[]): Promise<QueryResult<T>>;
  end(): Promise<void>;
} 