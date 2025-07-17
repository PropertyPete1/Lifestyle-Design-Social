export interface InstagramPostOptions {
    videoPath: string;
    caption: string;
    hashtags: string[];
    accessToken: string;
    userId: string;
    location?: string;
    musicUsed?: string;
}
export interface InstagramPostResult {
    success: boolean;
    postId?: string;
    permalink?: string;
    error?: string;
    engagementMetrics?: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
        reach: number;
        impressions: number;
    };
}
export interface InstagramAccountInfo {
    id: string;
    username: string;
    accountType: string;
    mediaCount: number;
    connected: boolean;
}
export declare class InstagramService {
    private userModel;
    constructor();
    postVideo(options: InstagramPostOptions): Promise<InstagramPostResult>;
    private simulateInstagramPost;
    getAccountInfo(accessToken: string): Promise<any>;
    refreshAccessToken(refreshToken: string): Promise<string | null>;
    getMedia(accessToken: string, limit?: number): Promise<any[]>;
    getInsights(accessToken: string, postId: string): Promise<any>;
    validateCredentials(accessToken: string): Promise<boolean>;
    getOptimalPostingTimes(accessToken: string): Promise<string[]>;
    checkApiStatus(): Promise<boolean>;
}
export default InstagramService;
//# sourceMappingURL=instagramService.d.ts.map