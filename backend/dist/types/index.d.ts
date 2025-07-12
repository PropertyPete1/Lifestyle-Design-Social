export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
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
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'premium';
    subscription: SubscriptionPlan;
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    timezone: string;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
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
export interface SubscriptionPlan {
    id: string;
    name: 'free' | 'basic' | 'pro' | 'enterprise';
    price: number;
    interval: 'monthly' | 'yearly';
    features: SubscriptionFeatures;
    limits: SubscriptionLimits;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
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
    lastPostedAt?: Date;
    nextPostDate?: Date;
    isActive: boolean;
    coolOffDays: number;
    createdAt: Date;
    updatedAt: Date;
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
export interface Post {
    id: string;
    userId: string;
    videoId: string;
    platform: SocialPlatform;
    content: PostContent;
    status: PostStatus;
    scheduledTime: Date;
    postedTime?: Date;
    engagementMetrics?: EngagementMetrics;
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
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
    tokenExpiresAt?: Date;
    scopes: string[];
    isActive: boolean;
    lastSyncAt?: Date;
    syncStatus: SyncStatus;
    accountType: AccountType;
    businessInfo?: BusinessInfo;
    createdAt: Date;
    updatedAt: Date;
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
export interface AICaption {
    id: string;
    userId: string;
    videoId?: string;
    originalCaption?: string;
    generatedCaption: string;
    style: CaptionStyle;
    tone: CaptionTone;
    length: CaptionLength;
    includeHashtags: boolean;
    includeCTA: boolean;
    customPrompt?: string;
    aiModel: string;
    confidence: number;
    variations: string[];
    performance?: CaptionPerformance;
    createdAt: Date;
}
export interface CaptionPerformance {
    timesUsed: number;
    avgEngagementRate: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    bestPerformingPost?: string;
}
export type CaptionStyle = 'professional' | 'casual' | 'funny' | 'inspirational' | 'sales' | 'storytelling';
export type CaptionTone = 'formal' | 'friendly' | 'excited' | 'confident' | 'empathetic' | 'humorous';
export type CaptionLength = 'short' | 'medium' | 'long';
export interface Analytics {
    id: string;
    userId: string;
    postId?: string;
    platform: SocialPlatform;
    date: Date;
    metrics: AnalyticsMetrics;
    demographics?: Demographics;
    insights?: Insights;
    createdAt: Date;
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
    date: Date;
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
export interface Schedule {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isActive: boolean;
    timezone: string;
    postingTimes: ScheduleTime[];
    frequency: ScheduleFrequency;
    platforms: SocialPlatform[];
    contentRules: ContentRule[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ScheduleTime {
    dayOfWeek: number;
    hour: number;
    minute: number;
    priority: number;
}
export interface ScheduleFrequency {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    maxPostsPerDay: number;
    minHoursBetweenPosts: number;
}
export interface ContentRule {
    type: 'category' | 'tag' | 'duration' | 'quality';
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
    weight: number;
}
export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    service: ApiService;
    keyHash: string;
    lastUsed?: Date;
    isActive: boolean;
    permissions: ApiPermission[];
    rateLimit: RateLimit;
    createdAt: Date;
    updatedAt: Date;
}
export interface RateLimit {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    currentUsage: number;
    resetTime: Date;
}
export type ApiService = 'openai' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
export type ApiPermission = 'read' | 'write' | 'admin';
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    scheduledAt?: Date;
    sentAt?: Date;
    createdAt: Date;
}
export type NotificationType = 'post_success' | 'post_failure' | 'schedule_reminder' | 'limit_reached' | 'subscription_expiring' | 'new_feature' | 'maintenance';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}
export interface AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    context?: Record<string, any>;
}
export interface AuthenticatedRequest extends Request {
    user: User;
    userId: string;
}
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export interface AppConfig {
    port: number;
    nodeEnv: string;
    database: DatabaseConfig;
    redis: RedisConfig;
    aws: AWSConfig;
    stripe: StripeConfig;
    jwt: JWTConfig;
    upload: UploadConfig;
    ai: AIConfig;
    socialPlatforms: SocialPlatformConfig;
    email: EmailConfig;
    sms: SMSConfig;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
    connectionTimeout: number;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
}
export interface AWSConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3: {
        bucket: string;
        cloudFrontDomain?: string;
    };
    ses: {
        fromEmail: string;
        replyToEmail: string;
    };
}
export interface StripeConfig {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    products: Record<string, string>;
}
export interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
}
export interface UploadConfig {
    maxFileSize: number;
    allowedMimeTypes: string[];
    destination: string;
    enableVirusScan: boolean;
}
export interface AIConfig {
    openai: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    replicate: {
        apiKey: string;
    };
}
export interface SocialPlatformConfig {
    instagram: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes: string[];
    };
    tiktok: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes: string[];
    };
    youtube: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes: string[];
    };
}
export interface EmailConfig {
    provider: 'ses' | 'sendgrid' | 'mailgun';
    apiKey: string;
    fromEmail: string;
    replyToEmail: string;
    templates: Record<string, string>;
}
export interface SMSConfig {
    provider: 'twilio' | 'aws-sns';
    accountSid: string;
    authToken: string;
    fromNumber: string;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Timestamps = {
    createdAt: Date;
    updatedAt: Date;
};
export type WithTimestamps<T> = T & Timestamps;
export type PaginationParams = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};
export type FilterParams<T> = {
    [K in keyof T]?: T[K] | T[K][] | {
        operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne' | 'in' | 'nin' | 'like';
        value: T[K];
    };
};
export type ServiceResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
};
export type AsyncServiceResponse<T> = Promise<ServiceResponse<T>>;
export interface SocketEvent {
    type: string;
    payload: any;
    timestamp: Date;
    userId?: string;
}
export interface PostUpdateEvent extends SocketEvent {
    type: 'post_update';
    payload: {
        postId: string;
        status: PostStatus;
        platform: SocialPlatform;
        metrics?: EngagementMetrics;
    };
}
export interface VideoProcessingEvent extends SocketEvent {
    type: 'video_processing';
    payload: {
        videoId: string;
        status: ProcessingStatus;
        progress: number;
        error?: string;
    };
}
export interface AnalyticsUpdateEvent extends SocketEvent {
    type: 'analytics_update';
    payload: {
        userId: string;
        platform: SocialPlatform;
        metrics: AnalyticsMetrics;
        date: Date;
    };
}
//# sourceMappingURL=index.d.ts.map