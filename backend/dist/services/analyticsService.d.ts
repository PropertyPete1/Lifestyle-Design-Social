import { IPost } from '../models/Post';
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
    bestPerformingPosts: IPost[];
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
        topPerformers: IPost[];
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
        bestPost: IPost | null;
        posts: IPost[];
    }>;
    exportAnalytics(userId: string, format?: 'csv' | 'json'): Promise<string>;
    private convertToCSV;
    getVideoAnalytics(videoId: string): Promise<{
        totalPosts: number;
        totalEngagement: number;
        averageEngagementRate: number;
        bestPost: IPost | null;
        posts: IPost[];
    }>;
    getPostAnalytics(postId: string): Promise<{
        id: any;
        userId: string;
        platform: "instagram" | "tiktok" | "facebook" | "youtube";
        content: string;
        status: "scheduled" | "posted" | "failed" | "cancelled";
        engagementMetrics: {
            likes: number;
            comments: number;
            shares: number;
            views: number;
            reach: number;
            impressions: number;
        };
        engagementRate: number;
        postedTime: Date | undefined;
        scheduledTime: Date;
    } | null>;
}
export declare const analyticsService: AnalyticsService;
export default AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map