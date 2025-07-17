export interface PostingSchedule {
    userId: string;
    times: string[];
    days: number[];
    categoryRotation: string[];
    postsPerDay: number;
    timezone: string;
}
export interface PostingResult {
    success: boolean;
    postId?: string;
    error?: string;
    engagementMetrics?: any;
    scheduledTime: Date;
    videoId: string;
    platform: string;
}
export interface SmartPostingOptions {
    useEngagementData?: boolean;
    avoidDuplicateContent?: boolean;
    optimizeTiming?: boolean;
    testMode?: boolean;
}
export declare class AutoPostingService {
    private userModel;
    private videoModel;
    private postModel;
    private instagramService;
    private captionService;
    private analyticsService;
    constructor();
    schedulePosts(userId: string, days?: number): Promise<PostingResult[]>;
    private scheduleSinglePost;
    executeScheduledPosts(): Promise<PostingResult[]>;
    private executePost;
    getOptimalPostingTimes(userId: string): Promise<string[]>;
    selectNextVideo(userId: string, _category: string, options?: SmartPostingOptions): Promise<any>;
    getPostingStats(userId: string, _days?: number): Promise<any>;
    private getNextScheduledPost;
    pauseAutoPosting(userId: string): Promise<void>;
    resumeAutoPosting(userId: string): Promise<void>;
    manualPost(userId: string): Promise<PostingResult>;
}
export declare const autoPostingService: AutoPostingService;
export default AutoPostingService;
//# sourceMappingURL=autoPostingService.d.ts.map