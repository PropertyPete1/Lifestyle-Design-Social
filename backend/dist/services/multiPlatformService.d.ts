export interface PlatformConfig {
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
}
export interface MultiPlatformPostOptions {
    videoPath: string;
    userId: string;
    platforms: PlatformConfig;
    caption?: string;
    hashtags?: string[];
    title?: string;
    description?: string;
    tags?: string[];
    privacyLevel?: 'public' | 'unlisted' | 'private';
    category?: string;
    tone?: 'professional' | 'casual' | 'funny' | 'luxury';
}
export interface MultiPlatformPostResult {
    success: boolean;
    results: {
        instagram?: any;
        tiktok?: any;
        youtube?: any;
    };
    errors: string[];
    totalEngagement: number;
}
export interface PlatformRequirements {
    instagram: {
        maxDuration: number;
        maxFileSize: number;
        recommendedDimensions: {
            width: number;
            height: number;
        };
        recommendedBitrate: number;
    };
    tiktok: {
        maxDuration: number;
        maxFileSize: number;
        recommendedDimensions: {
            width: number;
            height: number;
        };
        recommendedBitrate: number;
    };
    youtube: {
        maxDuration: number;
        maxFileSize: number;
        recommendedDimensions: {
            width: number;
            height: number;
        };
        recommendedBitrate: number;
    };
}
export declare class MultiPlatformService {
    private instagramService;
    private tiktokService;
    private youtubeService;
    private captionService;
    private videoService;
    private userModel;
    constructor();
    postToMultiplePlatforms(options: MultiPlatformPostOptions): Promise<MultiPlatformPostResult>;
    private processVideoForPlatforms;
    private generatePlatformCaption;
    private generateYouTubeContent;
    private getPlatformMaxLength;
    private getPlatformHashtagLimit;
    private getPlatformHashtags;
    private calculateEngagement;
    getPlatformRequirements(): PlatformRequirements;
    validatePlatformCredentials(userId: string): Promise<Record<string, boolean>>;
    getOptimalPostingTimes(userId: string): Promise<Record<string, string[]>>;
    getPlatformStats(userId: string): Promise<Record<string, any>>;
}
export default MultiPlatformService;
//# sourceMappingURL=multiPlatformService.d.ts.map