"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const logger_1 = require("../utils/logger");
const Post_1 = require("../models/Post");
const Video_1 = require("../models/Video");
class AnalyticsService {
    constructor() {
        this.postModel = Post_1.Post;
        this.videoModel = Video_1.Video;
    }
    async recordPostEngagement(postId, metrics) {
        try {
            logger_1.logger.info(`Recording engagement for post ${postId}`);
            const engagementRate = this.calculateEngagementRate(metrics);
            await this.postModel.findByIdAndUpdate(postId, {
                engagementMetrics: {
                    likes: metrics.likes,
                    comments: metrics.comments,
                    shares: metrics.shares,
                    views: metrics.views,
                    reach: metrics.reach,
                    impressions: metrics.impressions,
                },
            });
            logger_1.logger.info(`Recorded engagement for post ${postId}: ${engagementRate.toFixed(2)}%`);
        }
        catch (error) {
            logger_1.logger.error('Failed to record post engagement:', error);
            throw error;
        }
    }
    calculateEngagementRate(metrics) {
        const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
        const reach = metrics.reach || metrics.impressions || 1000;
        return (totalEngagement / reach) * 100;
    }
    async getUserAnalytics(userId, days = 30) {
        try {
            logger_1.logger.info(`Getting analytics for user ${userId} (${days} days)`);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const posts = await this.postModel.find({
                userId,
                status: 'posted',
                postedTime: { $gte: startDate, $lte: new Date() }
            });
            const totalPosts = posts.length;
            const totalEngagement = posts.reduce((sum, post) => {
                const metrics = post.engagementMetrics;
                return sum + (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0);
            }, 0);
            const averageEngagementRate = posts.length > 0
                ? posts.reduce((sum, post) => {
                    const metrics = post.engagementMetrics;
                    if (!metrics)
                        return sum;
                    const engagement = metrics.likes + metrics.comments + metrics.shares;
                    const reach = metrics.reach || metrics.impressions || 1000;
                    return sum + (engagement / reach) * 100;
                }, 0) / posts.length
                : 0;
            const bestPerformingPosts = posts
                .filter((post) => post.engagementMetrics)
                .sort((a, b) => {
                const aRate = this.calculatePostEngagementRate(a);
                const bRate = this.calculatePostEngagementRate(b);
                return bRate - aRate;
            })
                .slice(0, 5);
            const postingTrends = this.analyzePostingTrends(posts);
            const categoryPerformance = await this.analyzeCategoryPerformance(userId, startDate);
            const timeAnalysis = this.analyzePostingTimes(posts);
            return {
                totalPosts,
                totalEngagement,
                averageEngagementRate,
                bestPerformingPosts,
                postingTrends,
                categoryPerformance,
                timeAnalysis,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user analytics:', error);
            throw error;
        }
    }
    calculatePostEngagementRate(post) {
        const metrics = post.engagementMetrics;
        if (!metrics)
            return 0;
        const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
        const reach = metrics.reach || metrics.impressions || 1000;
        return (totalEngagement / reach) * 100;
    }
    analyzePostingTrends(posts) {
        const trends = [];
        const dailyStats = {};
        posts.forEach(post => {
            const date = post.postedTime ? new Date(post.postedTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            if (date) {
                if (!dailyStats[date]) {
                    dailyStats[date] = { posts: 0, engagement: 0 };
                }
                dailyStats[date].posts++;
                const metrics = post.engagementMetrics;
                if (metrics) {
                    dailyStats[date].engagement += metrics.likes + metrics.comments + metrics.shares;
                }
            }
        });
        Object.entries(dailyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([date, stats]) => {
            trends.push({
                date,
                posts: stats.posts,
                engagement: stats.engagement,
                averageEngagement: stats.posts > 0 ? stats.engagement / stats.posts : 0,
            });
        });
        return trends;
    }
    async analyzeCategoryPerformance(userId, startDate) {
        try {
            const videos = await this.videoModel.find({ userId });
            const posts = await this.postModel.find({
                userId,
                postedTime: { $gte: startDate }
            });
            const categoryStats = {};
            videos.forEach((video) => {
                const category = video.category;
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        totalVideos: 0,
                        totalPosts: 0,
                        totalEngagement: 0,
                        averageEngagementRate: 0,
                    };
                }
                categoryStats[category].totalVideos++;
            });
            posts.forEach((post) => {
                const video = videos.find((v) => v.id === post.videoId);
                if (video) {
                    const category = video.category;
                    const categoryData = categoryStats[category];
                    if (categoryData) {
                        categoryData.totalPosts++;
                        const metrics = post.engagementMetrics;
                        if (metrics) {
                            categoryData.totalEngagement +=
                                metrics.likes + metrics.comments + metrics.shares;
                        }
                    }
                }
            });
            Object.values(categoryStats).forEach(stats => {
                if (stats.totalPosts > 0) {
                    stats.averageEngagementRate = stats.totalEngagement / stats.totalPosts;
                }
            });
            return categoryStats;
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze category performance:', error);
            return {
                'real-estate': {
                    totalVideos: 0,
                    totalPosts: 0,
                    totalEngagement: 0,
                    averageEngagementRate: 0,
                },
                'cartoon': {
                    totalVideos: 0,
                    totalPosts: 0,
                    totalEngagement: 0,
                    averageEngagementRate: 0,
                }
            };
        }
    }
    analyzePostingTimes(posts) {
        const hourlyStats = {};
        for (let hour = 0; hour < 24; hour++) {
            hourlyStats[hour] = { engagement: 0, count: 0 };
        }
        posts.forEach(post => {
            const hour = post.postedTime ? new Date(post.postedTime).getHours() : 0;
            const metrics = post.engagementMetrics;
            const engagement = metrics ? metrics.likes + metrics.comments + metrics.shares : 0;
            if (hourlyStats[hour]) {
                hourlyStats[hour].engagement += engagement;
                hourlyStats[hour].count++;
            }
        });
        return Object.entries(hourlyStats).map(([hour, stats]) => ({
            hour: parseInt(hour),
            averageEngagement: stats.count > 0 ? stats.engagement / stats.count : 0,
            postCount: stats.count,
        }));
    }
    async getBestPostingTimes(userId, days = 90) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const posts = await this.postModel.find({
                userId,
                status: 'posted',
                postedTime: { $gte: startDate, $lte: new Date() }
            });
            const timeAnalysis = this.analyzePostingTimes(posts);
            const bestTimes = timeAnalysis
                .filter(time => time.postCount >= 3)
                .sort((a, b) => b.averageEngagement - a.averageEngagement)
                .slice(0, 5)
                .map(time => `${time.hour.toString().padStart(2, '0')}:00`);
            return {
                bestTimes,
                timeAnalysis,
                totalPostsAnalyzed: posts.length,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get best posting times:', error);
            return {
                bestTimes: ['09:00', '13:00', '18:00'],
                timeAnalysis: [],
                totalPostsAnalyzed: 0,
            };
        }
    }
    async getEngagementInsights(userId, days = 30) {
        try {
            const analytics = await this.getUserAnalytics(userId, days);
            const insights = {
                overallPerformance: {
                    totalPosts: analytics.totalPosts,
                    totalEngagement: analytics.totalEngagement,
                    averageEngagementRate: analytics.averageEngagementRate,
                    trend: this.calculateTrend(analytics.postingTrends),
                },
                topPerformers: analytics.bestPerformingPosts.slice(0, 3),
                categoryInsights: analytics.categoryPerformance,
                timeInsights: analytics.timeAnalysis,
                recommendations: this.generateRecommendations(analytics),
            };
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Failed to get engagement insights:', error);
            throw error;
        }
    }
    calculateTrend(trends) {
        if (trends.length < 14)
            return 'stable';
        const recent = trends.slice(-7);
        const previous = trends.slice(-14, -7);
        if (recent.length === 0 || previous.length === 0)
            return 'stable';
        const recentAvg = recent.reduce((sum, day) => sum + day.averageEngagement, 0) / recent.length;
        const previousAvg = previous.reduce((sum, day) => sum + day.averageEngagement, 0) / previous.length;
        if (previousAvg === 0)
            return 'stable';
        const change = ((recentAvg - previousAvg) / previousAvg) * 100;
        if (change > 10)
            return 'positive';
        if (change < -10)
            return 'negative';
        return 'stable';
    }
    generateRecommendations(analytics) {
        const recommendations = [];
        if (analytics.averageEngagementRate < 2) {
            recommendations.push('Consider posting more engaging content with better captions and hashtags');
        }
        else if (analytics.averageEngagementRate > 5) {
            recommendations.push('Great engagement! Keep up the quality content');
        }
        if (analytics.totalPosts < 10) {
            recommendations.push('Increase posting frequency to build audience engagement');
        }
        const categories = Object.entries(analytics.categoryPerformance);
        if (categories.length > 1) {
            const bestCategory = categories.reduce((best, current) => current[1].averageEngagementRate > best[1].averageEngagementRate ? current : best);
            recommendations.push(`Focus more on ${bestCategory[0]} content as it performs best`);
        }
        const bestTimes = analytics.timeAnalysis
            .filter(time => time.postCount >= 3)
            .sort((a, b) => b.averageEngagement - a.averageEngagement)
            .slice(0, 3);
        if (bestTimes.length > 0) {
            const timeRecommendation = `Post more during these hours: ${bestTimes.map(t => `${t.hour}:00`).join(', ')}`;
            recommendations.push(timeRecommendation);
        }
        return recommendations;
    }
    async getVideoPerformance(videoId) {
        try {
            const posts = await this.postModel.find({ videoId });
            if (posts.length === 0) {
                return {
                    totalPosts: 0,
                    totalEngagement: 0,
                    averageEngagementRate: 0,
                    bestPost: null,
                    posts: [],
                };
            }
            const totalPosts = posts.length;
            const totalEngagement = posts.reduce((sum, post) => {
                const metrics = post.engagementMetrics;
                return sum + (metrics ? metrics.likes + metrics.comments + metrics.shares : 0);
            }, 0);
            const averageEngagementRate = posts.reduce((sum, post) => sum + this.calculatePostEngagementRate(post), 0) / posts.length;
            const bestPost = posts.reduce((best, current) => this.calculatePostEngagementRate(current) > this.calculatePostEngagementRate(best) ? current : best);
            return {
                totalPosts,
                totalEngagement,
                averageEngagementRate,
                bestPost,
                posts,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get video performance:', error);
            throw error;
        }
    }
    async exportAnalytics(userId, format = 'json') {
        try {
            const analytics = await this.getUserAnalytics(userId, 365);
            if (format === 'csv') {
                return this.convertToCSV(analytics);
            }
            return JSON.stringify(analytics, null, 2);
        }
        catch (error) {
            logger_1.logger.error('Failed to export analytics:', error);
            throw error;
        }
    }
    convertToCSV(analytics) {
        const csvRows = [
            ['Metric', 'Value'],
            ['Total Posts', analytics.totalPosts.toString()],
            ['Total Engagement', analytics.totalEngagement.toString()],
            ['Average Engagement Rate', analytics.averageEngagementRate.toFixed(2)],
        ];
        csvRows.push(['', '']);
        csvRows.push(['Date', 'Posts', 'Engagement', 'Average Engagement']);
        analytics.postingTrends.forEach(trend => {
            csvRows.push([
                trend.date,
                trend.posts.toString(),
                trend.engagement.toString(),
                trend.averageEngagement.toFixed(2),
            ]);
        });
        return csvRows.map(row => row.join(',')).join('\n');
    }
    async getVideoAnalytics(videoId) {
        return this.getVideoPerformance(videoId);
    }
    async getPostAnalytics(postId) {
        try {
            const post = await this.postModel.findById(postId);
            if (!post) {
                return null;
            }
            return {
                id: post._id,
                userId: post.userId,
                platform: post.platform,
                content: post.content,
                status: post.status,
                engagementMetrics: post.engagementMetrics || {
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    views: 0,
                    reach: 0,
                    impressions: 0
                },
                engagementRate: this.calculatePostEngagementRate(post),
                postedTime: post.postedTime,
                scheduledTime: post.scheduledTime
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting post analytics:', error);
            throw error;
        }
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
exports.default = AnalyticsService;
