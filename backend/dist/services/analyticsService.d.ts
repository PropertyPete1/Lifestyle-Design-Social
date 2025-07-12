import { Post } from '../models/Post';
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
    bestPerformingPosts: Post[];
    postingTrends: PostingTrend[];
    categoryPerformance: Record<string, CategoryStats>;
    timeAnalysis: PostingTimeAnalysis[];
}
export interface PostingTrend {
    date: string;
    posts: number;
    engagement: number;
    averageEngagement: number;
}
export interface CategoryStats {
    totalVideos: number;
    totalPosts: number;
    totalEngagement: number;
    averageEngagementRate: number;
}
export interface PostingTimeAnalysis {
    hour: number;
    averageEngagement: number;
    postCount: number;
}
export declare class AnalyticsService {
    private postModel;
    private videoModel;
    private userModel;
    constructor();
    recordPostEngagement(postId: string, metrics: EngagementMetrics): Promise<void>;
    private calculateEngagementRate;
    getUserAnalytics(userId: string, days?: number): Promise<AnalyticsData>;
    private calculatePostEngagementRate;
    private analyzePostingTrends;
    private analyzeCategoryPerformance;
    private analyzePostingTimes;
    getBestPostingTimes(userId: string, days?: number): Promise<{
        bestTimes: string[];
        timeAnalysis: PostingTimeAnalysis[];
        totalPostsAnalyzed: number;
    }>;
    getEngagementInsights(userId: string, days?: number): Promise<{
        overallPerformance: {
            totalPosts: number;
            totalEngagement: number;
            averageEngagementRate: number;
            trend: string;
        };
        topPerformers: Post[];
        categoryInsights: Record<string, CategoryStats>;
        timeInsights: PostingTimeAnalysis[];
        recommendations: string[];
    }>;
    private calculateTrend;
    private generateRecommendations;
    getVideoPerformance(videoId: string): Promise<{
        totalPosts: number;
        totalEngagement: number;
        averageEngagementRate: number;
        bestPost: Post | null;
        posts: Post[];
    }>;
    exportAnalytics(userId: string, format?: 'csv' | 'json'): Promise<string>;
    private convertToCSV;
}
export default AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map