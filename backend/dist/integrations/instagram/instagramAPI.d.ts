export interface InstagramPost {
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    permalink: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    insights?: {
        impressions: number;
        reach: number;
        engagement: number;
    };
}
export interface InstagramAccount {
    id: string;
    username: string;
    account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
    media_count: number;
    followers_count?: number;
    follows_count?: number;
}
export interface InstagramAuthTokens {
    access_token: string;
    token_type: 'bearer';
    expires_in?: number;
    user_id?: string;
}
export declare class InstagramAPI {
    private baseURL;
    private authURL;
    private clientId;
    private clientSecret;
    private redirectUri;
    constructor(clientId: string, clientSecret: string, redirectUri: string);
    generateAuthUrl(state?: string): string;
    exchangeCodeForToken(code: string): Promise<InstagramAuthTokens>;
    getLongLivedToken(shortLivedToken: string): Promise<InstagramAuthTokens>;
    refreshAccessToken(accessToken: string): Promise<InstagramAuthTokens>;
    getAccountInfo(accessToken: string): Promise<InstagramAccount>;
    getUserMedia(accessToken: string, options?: {
        limit?: number;
        after?: string;
        before?: string;
        fields?: string[];
    }): Promise<{
        data: InstagramPost[];
        paging?: any;
    }>;
    getMediaInsights(mediaId: string, accessToken: string): Promise<any>;
    validateToken(accessToken: string): Promise<boolean>;
    createMediaContainer(accessToken: string, mediaData: {
        image_url?: string;
        video_url?: string;
        caption?: string;
        media_type?: 'IMAGE' | 'VIDEO';
    }): Promise<{
        id: string;
    }>;
    publishMedia(accessToken: string, creationId: string): Promise<{
        id: string;
    }>;
    getHashtagInfo(hashtag: string, accessToken: string): Promise<any>;
    analyzeUserContent(accessToken: string, options?: {
        postCount?: number;
        includeInsights?: boolean;
    }): Promise<{
        posts: InstagramPost[];
        analysis: {
            totalPosts: number;
            avgCaptionLength: number;
            commonHashtags: string[];
            topPerformingPosts: InstagramPost[];
            postingFrequency: any;
            engagementPatterns: any;
        };
    }>;
    private performContentAnalysis;
    private findBestPostingHours;
    private findBestPostingDays;
    generatePersonalizedCaption(userPosts: InstagramPost[], contentDescription: string, options?: {
        tone?: 'professional' | 'casual' | 'funny' | 'inspirational';
        includeHashtags?: boolean;
        maxLength?: number;
    }): Promise<{
        caption: string;
        hashtags: string[];
        styleMatch: number;
        confidence: number;
    }>;
    private analyzeWritingStyle;
    private generateStyledCaption;
    private suggestHashtags;
    private generateContentHashtags;
}
//# sourceMappingURL=instagramAPI.d.ts.map