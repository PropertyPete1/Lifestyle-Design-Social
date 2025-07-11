export interface EngagementMetrics {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    impressions: number;
    engagementRate?: number;
}
export interface AnalyticsData {
    totalPosts: number;
    totalEngagement: number;
    averageEngagementRate: number;
    bestPerformingPosts: any[];
    postingTrends: any[];
    categoryPerformance: Record<string, any>;
    timeAnalysis: any[];
}
export interface PostingTimeAnalysis {
    hour: number;
    averageEngagement: number;
    postCount: number;
    bestTimes: string[];
}
export declare class AnalyticsService {
    private postModel;
    private videoModel;
    private userModel;
    constructor();
    recordPostEngagement(postId: string, metrics: EngagementMetrics): Promise<void>;
    private calculateEngagementRate;
    getUserAnalytics(userId: string, days?: number): Promise<AnalyticsData>;
    private analyzePostingTrends;
    private analyzeCategoryPerformance;
    private analyzePostingTimes;
    getBestPostingTimes(userId: string, days?: number): Promise<any>;
    getEngagementInsights(userId: string, days?: number): Promise<any>;
    private calculateTrend;
    private generateRecommendations;
    getVideoPerformance(videoId: string): Promise<any>;
    exportAnalytics(userId: string, format?: 'csv' | 'json'): Promise<string>;
    private convertToCSV;
}
export default AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map