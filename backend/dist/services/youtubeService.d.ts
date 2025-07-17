export interface YouTubePostOptions {
    videoPath: string;
    title: string;
    description: string;
    tags: string[];
    accessToken: string;
    userId: string;
    categoryId?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    thumbnailPath?: string;
    language?: string;
    location?: string;
}
export interface YouTubePostResult {
    success: boolean;
    videoId?: string;
    videoUrl?: string;
    error?: string;
    engagementMetrics?: {
        views: number;
        likes: number;
        dislikes: number;
        comments: number;
        shares: number;
    };
}
export interface YouTubeAccountInfo {
    id: string;
    username: string;
    displayName: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    connected: boolean;
}
export declare class YouTubeService {
    private userModel;
    constructor();
    postVideo(options: YouTubePostOptions): Promise<YouTubePostResult>;
    private simulateYouTubePost;
    getAccountInfo(accessToken: string): Promise<YouTubeAccountInfo>;
    refreshAccessToken(userId: string, currentToken: string): Promise<string>;
    getVideos(accessToken: string, limit?: number): Promise<any[]>;
    getAnalytics(accessToken: string, days?: number): Promise<any>;
    validateCredentials(accessToken: string): Promise<boolean>;
    getOptimalPostingTimes(accessToken: string): Promise<string[]>;
    validateApiStatus(): Promise<boolean>;
    getVideoRequirements(): {
        maxDuration: number;
        maxFileSize: number;
        recommendedDimensions: {
            width: number;
            height: number;
        };
        recommendedBitrate: number;
        supportedFormats: string[];
    };
    generateYouTubeTitle(baseTitle: string, category: string): string;
    generateYouTubeDescription(caption: string, hashtags: string[]): string;
    generateYouTubeTags(category: string): string[];
}
export default YouTubeService;
//# sourceMappingURL=youtubeService.d.ts.map