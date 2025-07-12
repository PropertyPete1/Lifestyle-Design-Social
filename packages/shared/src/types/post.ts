// ========================================
// Post Types & Interfaces
// ========================================

export interface Post {
  id: string;
  userId: string;
  videoId: string;
  platform: SocialPlatform;
  platformPostId?: string; // ID returned by the platform after posting
  caption: string;
  hashtags: string[];
  scheduledAt: Date;
  postedAt?: Date;
  status: PostStatus;
  errorMessage?: string;
  retryCount: number;
  engagementData?: EngagementData;
  optimization: PostOptimization;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  videoId: string;
  platform: SocialPlatform;
  caption?: string;
  hashtags?: string[];
  scheduledAt: Date;
  useAIOptimization?: boolean;
  templateId?: string;
}

export interface UpdatePostInput {
  caption?: string;
  hashtags?: string[];
  scheduledAt?: Date;
  status?: PostStatus;
}

export interface PostOptimization {
  aiGenerated: boolean;
  originalCaption?: string;
  optimizedCaption: string;
  captionScore: number; // 0-10
  hashtagStrategy: HashtagStrategy;
  postingTimeScore: number; // 0-10
  viralPotential: number; // 0-10
  expectedPerformance: PerformanceProjection;
  recommendations: OptimizationRecommendation[];
}

export interface EngagementData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  clicks?: number;
  reach?: number;
  impressions?: number;
  engagementRate: number;
  lastUpdated: Date;
}

export interface HashtagStrategy {
  strategy: HashtagStrategyType;
  primaryHashtags: string[]; // High-performing, consistent tags
  secondaryHashtags: string[]; // Category-specific tags
  trendingHashtags: string[]; // Current trending tags
  longTailHashtags: string[]; // Niche, specific tags
  totalCount: number;
  expectedReach: number;
}

export interface PerformanceProjection {
  expectedViews: {
    min: number;
    max: number;
    average: number;
  };
  expectedEngagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  confidence: number; // 0-1
  baselineComparison: number; // % better than average
}

export interface OptimizationRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  confidence: number;
}

// ========================================
// Smart Posting Algorithm Types
// ========================================

export interface SmartPostingAnalysis {
  userId: string;
  platform: SocialPlatform;
  analysisDate: Date;
  timeAnalysis: PostingTimeAnalysis;
  audienceInsights: AudienceInsights;
  contentPerformance: ContentPerformanceAnalysis;
  recommendations: SmartPostingRecommendations;
  confidence: number;
}

export interface PostingTimeAnalysis {
  optimalTimes: OptimalPostingTime[];
  timeZone: string;
  analysisPerod: {
    startDate: Date;
    endDate: Date;
    dataPoints: number;
  };
  patterns: PostingPattern[];
  seasonality: SeasonalityData;
}

export interface OptimalPostingTime {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  score: number; // 0-10
  expectedEngagement: number;
  confidence: number;
  historicalData: {
    posts: number;
    averageViews: number;
    averageEngagement: number;
  };
}

export interface AudienceInsights {
  activeHours: HourlyActivity[];
  demographics: AudienceDemographics;
  behavior: AudienceBehavior;
  growth: AudienceGrowth;
  engagement: AudienceEngagement;
}

export interface HourlyActivity {
  hour: number;
  activityScore: number; // 0-100
  followerCount: number;
  engagementRate: number;
  dayOfWeek?: number; // For day-specific analysis
}

export interface AudienceDemographics {
  ageGroups: AgeGroup[];
  locations: Location[];
  interests: string[];
  languages: Language[];
}

export interface ContentPerformanceAnalysis {
  topPerformingContent: ContentMetrics[];
  contentCategories: CategoryPerformance[];
  hashtagPerformance: HashtagPerformance[];
  captionAnalysis: CaptionAnalysis;
  optimalContentLength: ContentLengthAnalysis;
}

export interface SmartPostingRecommendations {
  nextPostTime: Date;
  alternativeTimes: Date[];
  contentSuggestions: ContentSuggestion[];
  hashtagRecommendations: string[];
  captionTips: string[];
  frequencyRecommendation: FrequencyRecommendation;
}

// ========================================
// Caption Generation & Optimization
// ========================================

export interface CaptionGenerator {
  generateCaption(input: CaptionGenerationInput): Promise<CaptionGenerationResult>;
  optimizeCaption(caption: string, context: CaptionOptimizationContext): Promise<CaptionOptimizationResult>;
  analyzeCaption(caption: string): Promise<CaptionAnalysisResult>;
}

export interface CaptionGenerationInput {
  videoId: string;
  platform: SocialPlatform;
  tone: CaptionTone;
  style: CaptionStyle;
  includeCallToAction: boolean;
  targetAudience: TargetAudience;
  contentContext: ContentContext;
  brandVoice?: BrandVoice;
}

export interface CaptionOptimizationContext {
  platform: SocialPlatform;
  targetAudience: TargetAudience;
  postingTime: Date;
  historicalPerformance: HistoricalPerformance;
  currentTrends: TrendingTopic[];
}

export interface CaptionGenerationResult {
  captions: GeneratedCaption[];
  metadata: CaptionMetadata;
  confidence: number;
}

export interface GeneratedCaption {
  text: string;
  score: number; // 0-10
  reasoning: string;
  tone: CaptionTone;
  style: CaptionStyle;
  hashtags: string[];
  callToAction?: string;
  estimatedPerformance: PerformanceEstimate;
}

export interface CaptionOptimizationResult {
  originalCaption: string;
  optimizedCaption: string;
  improvements: CaptionImprovement[];
  score: number;
  confidence: number;
}

export interface CaptionAnalysisResult {
  sentiment: SentimentAnalysis;
  readability: ReadabilityScore;
  keywords: ExtractedKeyword[];
  callToAction: CallToActionAnalysis;
  viralPotential: number;
  engagement_prediction: EngagementPrediction;
}

// ========================================
// Hashtag Optimization
// ========================================

export interface HashtagOptimizer {
  generateHashtags(input: HashtagGenerationInput): Promise<HashtagGenerationResult>;
  analyzeHashtagPerformance(hashtags: string[], timeframe: TimeFrame): Promise<HashtagAnalysisResult>;
  findTrendingHashtags(category: string, platform: SocialPlatform): Promise<TrendingHashtag[]>;
}

export interface HashtagGenerationInput {
  content: string;
  category: VideoCategory;
  platform: SocialPlatform;
  targetAudience: TargetAudience;
  strategy: HashtagStrategyType;
  count: number;
  avoidOverused: boolean;
}

export interface HashtagGenerationResult {
  hashtags: RecommendedHashtag[];
  strategy: HashtagStrategy;
  expectedReach: number;
  competitiveness: number;
}

export interface RecommendedHashtag {
  tag: string;
  category: HashtagCategory;
  popularity: PopularityLevel;
  competitiveness: number; // 0-10
  expectedReach: number;
  trendingScore: number;
  relevanceScore: number;
  usageFrequency: UsageFrequency;
}

export interface TrendingHashtag {
  tag: string;
  volume: number;
  growth: number; // % growth in last 24h
  category: string;
  platform: SocialPlatform;
  expiresAt: Date;
}

// ========================================
// Viral Optimization Engine
// ========================================

export interface ViralOptimizer {
  analyzeViralPotential(videoId: string): Promise<ViralAnalysisResult>;
  optimizeForVirality(post: Post): Promise<ViralOptimizationResult>;
  getViralTrends(platform: SocialPlatform): Promise<ViralTrend[]>;
}

export interface ViralAnalysisResult {
  score: number; // 0-10
  factors: ViralFactor[];
  recommendations: ViralRecommendation[];
  benchmarks: ViralBenchmark[];
  confidence: number;
}

export interface ViralFactor {
  type: ViralFactorType;
  score: number;
  weight: number;
  description: string;
  suggestions: string[];
}

export interface ViralOptimizationResult {
  originalPost: Post;
  optimizedPost: Post;
  improvements: ViralImprovement[];
  expectedIncrease: number; // % increase in engagement
  confidence: number;
}

export interface ViralTrend {
  topic: string;
  platform: SocialPlatform;
  volume: number;
  growth: number;
  duration: number; // hours
  relevantHashtags: string[];
  exampleContent: string[];
}

// ========================================
// Enums
// ========================================

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  POSTING = 'posting',
  POSTED = 'posted',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

export enum HashtagStrategyType {
  BALANCED = 'balanced',
  TRENDING_FOCUSED = 'trending_focused',
  NICHE_FOCUSED = 'niche_focused',
  BROAD_REACH = 'broad_reach',
  ENGAGEMENT_FOCUSED = 'engagement_focused'
}

export enum RecommendationType {
  TIMING = 'timing',
  CAPTION = 'caption',
  HASHTAGS = 'hashtags',
  CONTENT = 'content',
  FREQUENCY = 'frequency'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum CaptionTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FUNNY = 'funny',
  INSPIRATIONAL = 'inspirational',
  URGENT = 'urgent',
  EDUCATIONAL = 'educational',
  EMOTIONAL = 'emotional'
}

export enum CaptionStyle {
  STORY = 'story',
  QUESTION = 'question',
  LIST = 'list',
  QUOTE = 'quote',
  FACT = 'fact',
  TESTIMONIAL = 'testimonial',
  BEHIND_SCENES = 'behind_scenes'
}

export enum HashtagCategory {
  BRANDED = 'branded',
  COMMUNITY = 'community',
  TRENDING = 'trending',
  NICHE = 'niche',
  LOCATION = 'location',
  INDUSTRY = 'industry'
}

export enum PopularityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VIRAL = 'viral'
}

export enum UsageFrequency {
  NEVER_USED = 'never_used',
  RARELY_USED = 'rarely_used',
  OCCASIONALLY_USED = 'occasionally_used',
  FREQUENTLY_USED = 'frequently_used',
  OVERUSED = 'overused'
}

export enum ViralFactorType {
  TIMING = 'timing',
  CONTENT_QUALITY = 'content_quality',
  HASHTAG_STRATEGY = 'hashtag_strategy',
  CAPTION_QUALITY = 'caption_quality',
  AUDIENCE_RESONANCE = 'audience_resonance',
  TREND_ALIGNMENT = 'trend_alignment',
  EMOTIONAL_IMPACT = 'emotional_impact'
}

export enum VideoCategory {
  REAL_ESTATE = 'real-estate',
  PROPERTY_TOUR = 'property-tour',
  MARKET_UPDATE = 'market-update',
  TIPS_ADVICE = 'tips-advice',
  CARTOON = 'cartoon',
  TESTIMONIAL = 'testimonial'
}

// ========================================
// Supporting Types
// ========================================

export interface PostingPattern {
  pattern: string;
  frequency: number;
  averageEngagement: number;
  bestDays: number[];
  bestTimes: number[];
}

export interface SeasonalityData {
  monthly: MonthlyTrend[];
  weekly: WeeklyTrend[];
  daily: DailyTrend[];
}

export interface MonthlyTrend {
  month: number;
  score: number;
  volume: number;
}

export interface WeeklyTrend {
  week: number;
  score: number;
  volume: number;
}

export interface DailyTrend {
  day: number;
  score: number;
  volume: number;
}

export interface AgeGroup {
  range: string;
  percentage: number;
  engagement: number;
}

export interface Location {
  country: string;
  city?: string;
  percentage: number;
  timezone: string;
}

export interface Language {
  code: string;
  name: string;
  percentage: number;
}

export interface ContentMetrics {
  contentId: string;
  type: string;
  views: number;
  engagement: number;
  score: number;
}

export interface CategoryPerformance {
  category: string;
  posts: number;
  averageViews: number;
  averageEngagement: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface HashtagPerformance {
  hashtag: string;
  usage: number;
  averageViews: number;
  averageEngagement: number;
  trendScore: number;
}

export interface CaptionAnalysis {
  averageLength: number;
  optimalLength: number;
  sentimentDistribution: SentimentDistribution;
  topKeywords: string[];
  callToActionUsage: number;
}

export interface ContentLengthAnalysis {
  optimalDuration: number;
  performanceByLength: LengthPerformance[];
}

export interface LengthPerformance {
  range: string;
  count: number;
  averageEngagement: number;
}

export interface ContentSuggestion {
  type: string;
  title: string;
  description: string;
  expectedPerformance: number;
}

export interface FrequencyRecommendation {
  optimal: number; // posts per day
  minimum: number;
  maximum: number;
  spacing: number; // hours between posts
}

export interface TargetAudience {
  demographics: string[];
  interests: string[];
  behaviorTraits: string[];
  preferredTimes: string[];
}

export interface ContentContext {
  propertyType?: string;
  location?: string;
  priceRange?: string;
  targetBuyers: string[];
  marketConditions: string;
}

export interface BrandVoice {
  tone: string;
  personality: string[];
  doNotUse: string[];
  preferredPhrases: string[];
}

export interface HistoricalPerformance {
  averageViews: number;
  averageEngagement: number;
  bestPerformingPosts: Post[];
  trends: PerformanceTrend[];
}

export interface TrendingTopic {
  topic: string;
  volume: number;
  relevance: number;
  hashtags: string[];
}

export interface CaptionMetadata {
  wordCount: number;
  characterCount: number;
  hashtagCount: number;
  mentionCount: number;
  linkCount: number;
  generationTime: number;
}

export interface PerformanceEstimate {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  confidence: number;
}

export interface CaptionImprovement {
  type: string;
  original: string;
  improved: string;
  reason: string;
  impact: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  emotions: EmotionScore[];
}

export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface ReadabilityScore {
  score: number;
  level: string;
  suggestions: string[];
}

export interface ExtractedKeyword {
  word: string;
  relevance: number;
  frequency: number;
}

export interface CallToActionAnalysis {
  present: boolean;
  type?: string;
  effectiveness: number;
  suggestions: string[];
}

export interface EngagementPrediction {
  likes: number;
  comments: number;
  shares: number;
  confidence: number;
  factors: string[];
}

export interface TimeFrame {
  start: Date;
  end: Date;
}

export interface HashtagAnalysisResult {
  hashtags: AnalyzedHashtag[];
  overall: HashtagOverallAnalysis;
  recommendations: string[];
}

export interface AnalyzedHashtag {
  tag: string;
  posts: number;
  totalViews: number;
  totalEngagement: number;
  averageViews: number;
  averageEngagement: number;
  trend: 'up' | 'down' | 'stable';
  score: number;
}

export interface HashtagOverallAnalysis {
  totalReach: number;
  averageEngagement: number;
  competitiveness: number;
  diversity: number;
  effectiveness: number;
}

export interface ViralRecommendation {
  type: string;
  title: string;
  description: string;
  expectedImpact: number;
  difficulty: EffortLevel;
}

export interface ViralBenchmark {
  metric: string;
  yourScore: number;
  industryAverage: number;
  topPerformers: number;
}

export interface ViralImprovement {
  aspect: string;
  change: string;
  expectedIncrease: number;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface PerformanceTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
}

export interface AudienceBehavior {
  averageSessionDuration: number;
  contentPreferences: string[];
  engagementPatterns: string[];
  deviceUsage: DeviceUsage[];
}

export interface AudienceGrowth {
  rate: number;
  sources: GrowthSource[];
  retention: number;
  churn: number;
}

export interface AudienceEngagement {
  rate: number;
  patterns: EngagementPattern[];
  topContent: string[];
  preferences: string[];
}

export interface DeviceUsage {
  device: string;
  percentage: number;
  engagementRate: number;
}

export interface GrowthSource {
  source: string;
  percentage: number;
  quality: number;
}

export interface EngagementPattern {
  action: string;
  frequency: number;
  timing: string[];
}

// ========================================
// API Response Types
// ========================================

export interface PostResponse {
  success: boolean;
  data: Post;
  message?: string;
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  pagination?: PaginationInfo;
  message?: string;
}

export interface SmartPostingResponse {
  success: boolean;
  data: SmartPostingAnalysis;
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

export default Post; 