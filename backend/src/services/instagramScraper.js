"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const PostInsights_1 = __importDefault(require("../models/PostInsights"));
const TopHashtags_1 = __importDefault(require("../models/TopHashtags"));
class InstagramScraper {
    constructor(accessToken, pageId) {
        this.accessToken = accessToken;
        this.pageId = pageId;
    }
    /**
     * Fetch top 20 performing videos from Instagram page
     */
    async scrapeTopPerformingVideos() {
        try {
            // First, get all videos from page (up to 200 recent posts)
            const allVideos = await this.fetchPageVideos();
            // Calculate performance scores and sort
            const videosWithScores = allVideos.map(video => ({
                ...video,
                performanceScore: this.calculatePerformanceScore(video)
            }));
            // Sort by performance score and return top 20
            const topVideos = videosWithScores
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 20);
            console.log(`Found ${topVideos.length} top performing Instagram videos`);
            return topVideos;
        }
        catch (error) {
            console.error('Error scraping Instagram videos:', error);
            throw error;
        }
    }
    /**
     * Fetch video posts from Instagram page
     */
    async fetchPageVideos() {
        var _a;
        const videos = [];
        let nextUrl = '';
        let totalFetched = 0;
        try {
            // Initial request to get page media
            let url = `https://graph.facebook.com/v19.0/${this.pageId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${this.accessToken}&limit=25`;
            while (totalFetched < 200) { // Limit to 200 posts for analysis
                const response = await axios_1.default.get(url);
                const data = response.data;
                if (!data.data || data.data.length === 0) {
                    break;
                }
                // Filter for video content and get insights
                for (const media of data.data) {
                    if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
                        try {
                            // Get insights for this media
                            const insights = await this.getMediaInsights(media.id);
                            const enrichedVideo = {
                                ...media,
                                like_count: insights.like_count || 0,
                                comments_count: insights.comments_count || 0,
                                video_views: insights.video_views || 0
                            };
                            videos.push(enrichedVideo);
                        }
                        catch (insightError) {
                            console.warn(`Could not get insights for media ${media.id}:`, insightError);
                            // Add video without insights
                            videos.push(media);
                        }
                    }
                }
                totalFetched += data.data.length;
                // Check for next page
                if ((_a = data.paging) === null || _a === void 0 ? void 0 : _a.next) {
                    url = data.paging.next;
                }
                else {
                    break;
                }
                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return videos;
        }
        catch (error) {
            console.error('Error fetching Instagram page videos:', error);
            throw error;
        }
    }
    /**
     * Get insights for specific media
     */
    async getMediaInsights(mediaId) {
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v19.0/${mediaId}/insights?metric=likes,comments,video_views&access_token=${this.accessToken}`);
            const insights = response.data.data || [];
            const result = {};
            insights.forEach((insight) => {
                var _a, _b, _c;
                if (insight.name === 'likes') {
                    result.like_count = ((_a = insight.values[0]) === null || _a === void 0 ? void 0 : _a.value) || 0;
                }
                else if (insight.name === 'comments') {
                    result.comments_count = ((_b = insight.values[0]) === null || _b === void 0 ? void 0 : _b.value) || 0;
                }
                else if (insight.name === 'video_views') {
                    result.video_views = ((_c = insight.values[0]) === null || _c === void 0 ? void 0 : _c.value) || 0;
                }
            });
            return result;
        }
        catch (error) {
            // If insights are not available, try alternative approach
            try {
                const response = await axios_1.default.get(`https://graph.facebook.com/v19.0/${mediaId}?fields=like_count,comments_count&access_token=${this.accessToken}`);
                return response.data;
            }
            catch (fallbackError) {
                console.warn(`Could not get insights for media ${mediaId}`);
                return {};
            }
        }
    }
    /**
     * Calculate performance score based on views, likes, comments
     */
    calculatePerformanceScore(video) {
        const views = video.video_views || 0;
        const likes = video.like_count || 0;
        const comments = video.comments_count || 0;
        // Weighted scoring: views (50%), likes (30%), comments (20%)
        const viewScore = views * 0.5;
        const likeScore = likes * 30; // Weight likes higher per unit
        const commentScore = comments * 20; // Weight comments highest per unit
        return Math.round(viewScore + likeScore + commentScore);
    }
    /**
     * Extract hashtags from Instagram caption
     */
    extractHashtags(caption) {
        if (!caption)
            return [];
        const hashtagRegex = /#[a-zA-Z0-9_]+/g;
        const hashtags = caption.match(hashtagRegex) || [];
        return hashtags.map(tag => tag.toLowerCase());
    }
    /**
     * Save scraped videos to PostInsights collection
     */
    async saveVideoInsights(videos) {
        var _a;
        try {
            for (const video of videos) {
                const hashtags = this.extractHashtags(video.caption || '');
                const performanceScore = this.calculatePerformanceScore(video);
                // Check if video already exists
                const existingInsight = await PostInsights_1.default.findOne({ videoId: video.id });
                if (!existingInsight) {
                    await PostInsights_1.default.create({
                        platform: 'instagram',
                        videoId: video.id,
                        caption: video.caption || '',
                        hashtags,
                        performanceScore,
                        repostEligible: true,
                        reposted: false,
                        originalPostDate: new Date(video.timestamp),
                        views: video.video_views || 0,
                        likes: video.like_count || 0,
                        comments: video.comments_count || 0,
                        title: ((_a = video.caption) === null || _a === void 0 ? void 0 : _a.substring(0, 100)) || 'Instagram Video'
                    });
                }
                else {
                    // Update existing record with latest stats
                    await PostInsights_1.default.findByIdAndUpdate(existingInsight._id, {
                        views: video.video_views || 0,
                        likes: video.like_count || 0,
                        comments: video.comments_count || 0,
                        performanceScore,
                        scrapedAt: new Date()
                    });
                }
            }
            console.log(`Saved ${videos.length} Instagram video insights to database`);
        }
        catch (error) {
            console.error('Error saving Instagram video insights:', error);
            throw error;
        }
    }
    /**
     * Update top hashtags based on scraped videos
     */
    async updateTopHashtags() {
        try {
            // Get all Instagram videos from PostInsights
            const instagramVideos = await PostInsights_1.default.find({ platform: 'instagram' });
            // Aggregate hashtag data
            const hashtagStats = new Map();
            for (const video of instagramVideos) {
                for (const hashtag of video.hashtags) {
                    if (!hashtagStats.has(hashtag)) {
                        hashtagStats.set(hashtag, {
                            usageCount: 0,
                            totalViews: 0,
                            totalLikes: 0,
                            videos: []
                        });
                    }
                    const stats = hashtagStats.get(hashtag);
                    stats.usageCount++;
                    stats.totalViews += video.views || 0;
                    stats.totalLikes += video.likes || 0;
                    stats.videos.push(video);
                }
            }
            // Update TopHashtags collection
            for (const [hashtag, stats] of Array.from(hashtagStats.entries())) {
                const avgViewScore = stats.usageCount > 0 ? stats.totalViews / stats.usageCount : 0;
                await TopHashtags_1.default.findOneAndUpdate({ hashtag }, {
                    hashtag,
                    usageCount: stats.usageCount,
                    avgViewScore,
                    platform: 'instagram',
                    totalViews: stats.totalViews,
                    totalLikes: stats.totalLikes,
                    lastUpdated: new Date()
                }, { upsert: true, new: true });
            }
            console.log(`Updated ${hashtagStats.size} Instagram hashtags in TopHashtags collection`);
        }
        catch (error) {
            console.error('Error updating Instagram top hashtags:', error);
            throw error;
        }
    }
    /**
     * Full scraping process: fetch videos, save insights, update hashtags
     */
    async performFullScrape() {
        try {
            console.log('Starting Instagram scraping process...');
            // 1. Scrape top performing videos
            const topVideos = await this.scrapeTopPerformingVideos();
            // 2. Save video insights
            await this.saveVideoInsights(topVideos);
            // 3. Update hashtag analytics
            await this.updateTopHashtags();
            // 4. Get hashtag count for return
            const hashtagCount = await TopHashtags_1.default.countDocuments({ platform: 'instagram' });
            console.log('Instagram scraping process completed successfully');
            return {
                videosScraped: topVideos.length,
                hashtagsUpdated: hashtagCount
            };
        }
        catch (error) {
            console.error('Error in Instagram full scrape process:', error);
            throw error;
        }
    }
}
exports.InstagramScraper = InstagramScraper;
