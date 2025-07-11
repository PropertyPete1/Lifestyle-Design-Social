export interface TikTokPostOptions {
    videoPath: string;
    caption: string;
    hashtags: string[];
    accessToken: string;
    userId: string;
    privacyLevel?: 'public' | 'friends' | 'private';
    disableDuet?: boolean;
    disableComment?: boolean;
    disableStitch?: boolean;
}
export interface TikTokPostResult {
    success: boolean;
    postId?: string;
    shareUrl?: string;
    error?: string;
    engagementMetrics?: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
        downloads: number;
    };
}
export interface TikTokAccountInfo {
    id: string;
    username: string;
    displayName: string;
    followerCount: number;
    followingCount: number;
    videoCount: number;
    connected: boolean;
}
export declare class TikTokService {
    private userModel;
    constructor();
    postVideo(options: TikTokPostOptions): Promise<TikTokPostResult>;
    private simulateTikTokPost;
    getAccountInfo(accessToken: string): Promise<TikTokAccountInfo>;
    refreshAccessToken(userId: string, currentToken: string): Promise<string>;
    getMedia(accessToken: string, limit?: number): Promise<any[]>;
    getInsights(accessToken: string, days?: number): Promise<any>;
    validateCredentials(accessToken: string): Promise<boolean>;
    getOptimalPostingTimes(accessToken: string): Promise<string[]>;
    checkApiStatus(): Promise<boolean>;
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
}
export default TikTokService;
//# sourceMappingURL=tiktokService.d.ts.map