"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramService = void 0;
const logger_1 = require("../utils/logger");
class InstagramService {
    constructor() {
        this.GRAPH_API_VERSION = 'v18.0';
        this.BASE_URL = 'https://graph.facebook.com';
    }
    async postVideo(options) {
        try {
            logger_1.logger.info(`Posting video to Instagram for user ${options.userId}`);
            if (!options.accessToken) {
                throw new Error('Instagram access token required');
            }
            const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
            if (!businessAccountId) {
                throw new Error('Instagram Business Account ID not configured');
            }
            const mediaResponse = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/media`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: options.videoPath,
                    caption: `${options.caption}\n\n${options.hashtags.join(' ')}`,
                    access_token: options.accessToken
                })
            });
            const mediaData = await mediaResponse.json();
            if (mediaData.error) {
                throw new Error(`Instagram API Error: ${mediaData.error.message}`);
            }
            const publishResponse = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/media_publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    creation_id: mediaData.id,
                    access_token: options.accessToken
                })
            });
            const publishData = await publishResponse.json();
            if (publishData.error) {
                throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
            }
            logger_1.logger.info(`Successfully posted to Instagram: ${publishData.id}`);
            return {
                success: true,
                postId: publishData.id,
                permalink: `https://www.instagram.com/p/${publishData.id}/`
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to post to Instagram:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getAccountInfo(accessToken) {
        try {
            logger_1.logger.info('Getting Instagram account info');
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                throw new Error(`Instagram API Error: ${data.error.message}`);
            }
            return {
                id: data.id,
                username: data.username,
                accountType: data.account_type,
                mediaCount: data.media_count,
                connected: true
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Instagram account info:', error);
            return null;
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            logger_1.logger.info('Refreshing Instagram access token');
            const response = await fetch(`${this.BASE_URL}/oauth/access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`, {
                method: 'GET'
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(`Instagram Token Refresh Error: ${data.error.message}`);
            }
            return data.access_token;
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh Instagram token:', error);
            return null;
        }
    }
    async getMedia(accessToken, limit = 20) {
        try {
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                throw new Error(`Instagram API Error: ${data.error.message}`);
            }
            return data.data || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get Instagram media:', error);
            throw error;
        }
    }
    async getInsights(accessToken, postId) {
        try {
            logger_1.logger.info(`Getting Instagram insights for post: ${postId}`);
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/${postId}/insights?metric=impressions,reach,likes,comments,shares,saves&access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                throw new Error(`Instagram Insights Error: ${data.error.message}`);
            }
            const insights = data.data.reduce((acc, metric) => {
                acc[metric.name] = metric.values[0]?.value || 0;
                return acc;
            }, {});
            return {
                likes: insights.likes || 0,
                comments: insights.comments || 0,
                shares: insights.shares || 0,
                saves: insights.saves || 0,
                reach: insights.reach || 0,
                impressions: insights.impressions || 0,
                apiConfigured: true
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Instagram insights:', error);
            return null;
        }
    }
    async getOptimalPostingTimes(accessToken) {
        try {
            const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
            if (!businessAccountId) {
                throw new Error('Instagram Business Account ID not configured');
            }
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/insights?metric=audience_city,audience_country,audience_gender_age,audience_locale&period=lifetime&access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                throw new Error(`Instagram Audience Insights Error: ${data.error.message}`);
            }
            const defaultTimes = ['09:00', '12:00', '15:00', '18:00', '21:00'];
            return defaultTimes;
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze Instagram optimal posting times:', error);
            return ['09:00', '18:00'];
        }
    }
    async checkApiStatus() {
        try {
            const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
            if (!accessToken) {
                logger_1.logger.warn('Instagram access token not configured');
                return false;
            }
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                logger_1.logger.error('Instagram API status check failed:', data.error);
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Instagram API status check failed:', error);
            return false;
        }
    }
    async validateCredentials(accessToken) {
        if (!accessToken) {
            return false;
        }
        try {
            const response = await fetch(`${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?access_token=${accessToken}`);
            const data = await response.json();
            if (data.error) {
                logger_1.logger.error('Instagram credentials validation failed:', data.error);
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Instagram credentials validation error:', error);
            return false;
        }
    }
}
exports.InstagramService = InstagramService;
const instagramService = new InstagramService();
exports.default = instagramService;
