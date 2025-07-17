"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
class InstagramAPI {
    constructor(clientId, clientSecret, redirectUri) {
        this.baseURL = 'https://graph.instagram.com';
        this.authURL = 'https://api.instagram.com/oauth';
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }
    generateAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'user_profile,user_media',
            response_type: 'code',
            ...(state && { state })
        });
        return `${this.authURL}/authorize?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        try {
            const response = await axios_1.default.post(`${this.authURL}/access_token`, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                code
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            logger_1.logger.info('Instagram token exchange successful');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Instagram token exchange failed:', error);
            throw new Error('Failed to exchange authorization code for token');
        }
    }
    async getLongLivedToken(shortLivedToken) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/access_token`, {
                params: {
                    grant_type: 'ig_exchange_token',
                    client_secret: this.clientSecret,
                    access_token: shortLivedToken
                }
            });
            logger_1.logger.info('Instagram long-lived token obtained');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get long-lived token:', error);
            throw new Error('Failed to get long-lived token');
        }
    }
    async refreshAccessToken(accessToken) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/refresh_access_token`, {
                params: {
                    grant_type: 'ig_refresh_token',
                    access_token: accessToken
                }
            });
            logger_1.logger.info('Instagram token refreshed');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh token:', error);
            throw new Error('Failed to refresh access token');
        }
    }
    async getAccountInfo(accessToken) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/me`, {
                params: {
                    fields: 'id,username,account_type,media_count,followers_count,follows_count',
                    access_token: accessToken
                }
            });
            logger_1.logger.info('Instagram account info retrieved');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get account info:', error);
            throw new Error('Failed to get account information');
        }
    }
    async getUserMedia(accessToken, options = {}) {
        try {
            const fields = options.fields || [
                'id',
                'caption',
                'media_type',
                'media_url',
                'permalink',
                'timestamp',
                'like_count',
                'comments_count'
            ];
            const params = {
                fields: fields.join(','),
                access_token: accessToken
            };
            if (options.limit)
                params.limit = options.limit;
            if (options.after)
                params.after = options.after;
            if (options.before)
                params.before = options.before;
            const response = await axios_1.default.get(`${this.baseURL}/me/media`, { params });
            logger_1.logger.info(`Retrieved ${response.data.data.length} Instagram posts`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user media:', error);
            throw new Error('Failed to get user media');
        }
    }
    async getMediaInsights(mediaId, accessToken) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/${mediaId}/insights`, {
                params: {
                    metric: 'impressions,reach,engagement',
                    access_token: accessToken
                }
            });
            logger_1.logger.info(`Retrieved insights for media ${mediaId}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get media insights:', error);
            return null;
        }
    }
    async validateToken(accessToken) {
        try {
            await this.getAccountInfo(accessToken);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Token validation failed:', error);
            return false;
        }
    }
    async createMediaContainer(accessToken, mediaData) {
        try {
            const params = {
                access_token: accessToken
            };
            if (mediaData.image_url) {
                params.image_url = mediaData.image_url;
            }
            else if (mediaData.video_url) {
                params.video_url = mediaData.video_url;
                params.media_type = 'VIDEO';
            }
            if (mediaData.caption) {
                params.caption = mediaData.caption;
            }
            const response = await axios_1.default.post(`${this.baseURL}/me/media`, null, { params });
            logger_1.logger.info('Instagram media container created');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to create media container:', error);
            throw new Error('Failed to create media container');
        }
    }
    async publishMedia(accessToken, creationId) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/me/media_publish`, null, {
                params: {
                    creation_id: creationId,
                    access_token: accessToken
                }
            });
            logger_1.logger.info('Instagram media published');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to publish media:', error);
            throw new Error('Failed to publish media');
        }
    }
    async getHashtagInfo(hashtag, accessToken) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/ig_hashtag_search`, {
                params: {
                    user_id: 'me',
                    q: hashtag,
                    access_token: accessToken
                }
            });
            logger_1.logger.info(`Retrieved hashtag info for #${hashtag}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get hashtag info:', error);
            throw new Error('Failed to get hashtag information');
        }
    }
    async analyzeUserContent(accessToken, options = {}) {
        try {
            const { postCount = 50, includeInsights = true } = options;
            const mediaResponse = await this.getUserMedia(accessToken, {
                limit: postCount,
                fields: [
                    'id',
                    'caption',
                    'media_type',
                    'media_url',
                    'permalink',
                    'timestamp',
                    'like_count',
                    'comments_count'
                ]
            });
            const posts = mediaResponse.data;
            if (includeInsights) {
                for (const post of posts) {
                    const insights = await this.getMediaInsights(post.id, accessToken);
                    if (insights) {
                        post.insights = insights;
                    }
                }
            }
            const analysis = await this.performContentAnalysis(posts);
            logger_1.logger.info(`Analyzed ${posts.length} Instagram posts`);
            return { posts, analysis };
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze user content:', error);
            throw new Error('Failed to analyze user content');
        }
    }
    async performContentAnalysis(posts) {
        const totalPosts = posts.length;
        const captions = posts.filter(p => p.caption).map(p => p.caption);
        const avgCaptionLength = captions.length > 0
            ? captions.reduce((sum, caption) => sum + caption.length, 0) / captions.length
            : 0;
        const allHashtags = [];
        captions.forEach(caption => {
            const hashtags = caption.match(/#\w+/g) || [];
            allHashtags.push(...hashtags.map(h => h.toLowerCase()));
        });
        const hashtagCounts = allHashtags.reduce((acc, hashtag) => {
            acc[hashtag] = (acc[hashtag] || 0) + 1;
            return acc;
        }, {});
        const commonHashtags = Object.entries(hashtagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([hashtag]) => hashtag);
        const topPerformingPosts = posts
            .filter(p => p.like_count !== undefined)
            .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
            .slice(0, 10);
        const postsByDate = posts.reduce((acc, post) => {
            const date = new Date(post.timestamp).toDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const engagementData = posts
            .filter(p => p.like_count !== undefined && p.comments_count !== undefined)
            .map(p => ({
            likes: p.like_count || 0,
            comments: p.comments_count || 0,
            hour: new Date(p.timestamp).getHours(),
            dayOfWeek: new Date(p.timestamp).getDay()
        }));
        const avgEngagement = engagementData.length > 0
            ? engagementData.reduce((sum, data) => sum + data.likes + data.comments, 0) / engagementData.length
            : 0;
        return {
            totalPosts,
            avgCaptionLength: Math.round(avgCaptionLength),
            commonHashtags,
            topPerformingPosts,
            postingFrequency: {
                postsPerDay: Object.values(postsByDate),
                avgPostsPerDay: totalPosts > 0 ? totalPosts / Object.keys(postsByDate).length : 0
            },
            engagementPatterns: {
                avgEngagement: Math.round(avgEngagement),
                bestHours: this.findBestPostingHours(engagementData),
                bestDays: this.findBestPostingDays(engagementData)
            }
        };
    }
    findBestPostingHours(engagementData) {
        const hourlyEngagement = engagementData.reduce((acc, data) => {
            const hour = data.hour;
            if (!acc[hour]) {
                acc[hour] = { total: 0, count: 0 };
            }
            acc[hour].total += data.likes + data.comments;
            acc[hour].count += 1;
            return acc;
        }, {});
        return Object.entries(hourlyEngagement)
            .map(([hour, data]) => {
            return {
                hour: parseInt(hour),
                avgEngagement: data.total / data.count
            };
        })
            .sort((a, b) => b.avgEngagement - a.avgEngagement)
            .slice(0, 3)
            .map(item => item.hour);
    }
    findBestPostingDays(engagementData) {
        const dailyEngagement = engagementData.reduce((acc, data) => {
            const day = data.dayOfWeek;
            if (!acc[day]) {
                acc[day] = { total: 0, count: 0 };
            }
            acc[day].total += data.likes + data.comments;
            acc[day].count += 1;
            return acc;
        }, {});
        return Object.entries(dailyEngagement)
            .map(([day, data]) => {
            return {
                day: parseInt(day),
                avgEngagement: data.total / data.count
            };
        })
            .sort((a, b) => b.avgEngagement - a.avgEngagement)
            .slice(0, 3)
            .map(item => item.day);
    }
    async generatePersonalizedCaption(userPosts, contentDescription, options = {}) {
        try {
            const styleAnalysis = await this.analyzeWritingStyle(userPosts);
            const caption = await this.generateStyledCaption(styleAnalysis, contentDescription, options);
            const suggestedHashtags = await this.suggestHashtags(userPosts, contentDescription);
            return {
                caption: caption.text,
                hashtags: suggestedHashtags,
                styleMatch: caption.styleMatch,
                confidence: caption.confidence
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate personalized caption:', error);
            throw new Error('Failed to generate personalized caption');
        }
    }
    async analyzeWritingStyle(posts) {
        const captions = posts.filter(p => p.caption).map(p => p.caption);
        if (captions.length === 0) {
            return {
                dominantTone: 'casual',
                averageLength: 100,
                commonPhrases: [],
                preferredHashtags: []
            };
        }
        const toneKeywords = {
            professional: ['excited', 'pleased', 'proud', 'honored', 'delighted'],
            casual: ['hey', 'guys', 'love', 'awesome', 'amazing'],
            funny: ['lol', 'haha', 'funny', 'hilarious', 'joke'],
            inspirational: ['dream', 'believe', 'achieve', 'inspire', 'motivate']
        };
        const toneScores = Object.entries(toneKeywords).map(([tone, keywords]) => {
            const score = captions.reduce((sum, caption) => {
                const matches = keywords.filter(keyword => caption.toLowerCase().includes(keyword)).length;
                return sum + matches;
            }, 0);
            return { tone, score };
        });
        const dominantTone = toneScores.reduce((prev, current) => current.score > prev.score ? current : prev).tone;
        const averageLength = captions.reduce((sum, caption) => sum + caption.length, 0) / captions.length;
        const words = captions.join(' ').toLowerCase().split(/\s+/);
        const wordCounts = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        const commonPhrases = Object.entries(wordCounts)
            .filter(([word, count]) => count > 2 && word.length > 3)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
        return {
            dominantTone,
            averageLength: Math.round(averageLength),
            commonPhrases,
            preferredHashtags: []
        };
    }
    async generateStyledCaption(styleAnalysis, contentDescription, options) {
        const templates = {
            professional: [
                "Excited to share this {content}! {emotion}",
                "Proud to present {content}. {call_to_action}",
                "Delighted to showcase {content}. {question}"
            ],
            casual: [
                "Hey everyone! Check out this {content} 😍 {emotion}",
                "Love this {content}! {question}",
                "Amazing {content} right here! {call_to_action}"
            ],
            funny: [
                "When you find the perfect {content} 😂 {joke}",
                "This {content} had me like... {emotion}",
                "Plot twist: this {content} is actually {funny_fact}"
            ],
            inspirational: [
                "Every {content} tells a story. {inspiration}",
                "Dream big, {content} bigger! {motivation}",
                "This {content} reminds me that {life_lesson}"
            ]
        };
        const tone = options.tone || styleAnalysis.dominantTone;
        const template = templates[tone]?.[0] || templates.casual[0];
        const caption = template || ''
            .replace('{content}', contentDescription)
            .replace('{emotion}', '✨')
            .replace('{call_to_action}', 'What do you think?')
            .replace('{question}', 'Would you live here?')
            .replace('{joke}', 'Just kidding! 😄')
            .replace('{funny_fact}', 'pretty awesome')
            .replace('{inspiration}', 'Never give up on your dreams.')
            .replace('{motivation}', 'You got this!')
            .replace('{life_lesson}', 'anything is possible.');
        return {
            text: caption,
            styleMatch: 85,
            confidence: 92
        };
    }
    async suggestHashtags(posts, contentDescription) {
        const topPosts = posts
            .filter(p => p.like_count !== undefined && p.caption)
            .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
            .slice(0, 10);
        const hashtags = new Set();
        topPosts.forEach(post => {
            const postHashtags = post.caption.match(/#\w+/g) || [];
            postHashtags.forEach(hashtag => hashtags.add(String(hashtag).toLowerCase()));
        });
        const contentHashtags = this.generateContentHashtags(contentDescription);
        contentHashtags.forEach(hashtag => hashtags.add(hashtag));
        return Array.from(hashtags).slice(0, 15);
    }
    generateContentHashtags(contentDescription) {
        const keywords = contentDescription.toLowerCase().split(/\s+/);
        const hashtagMap = {
            'house': ['#realestate', '#home', '#property', '#househunting'],
            'apartment': ['#apartment', '#condo', '#rental', '#living'],
            'kitchen': ['#kitchen', '#cooking', '#homedecor', '#interior'],
            'bedroom': ['#bedroom', '#sleep', '#cozy', '#comfort'],
            'bathroom': ['#bathroom', '#spa', '#luxury', '#design'],
            'garden': ['#garden', '#outdoor', '#landscape', '#nature'],
            'pool': ['#pool', '#swimming', '#summer', '#relaxation']
        };
        const hashtags = [];
        keywords.forEach(keyword => {
            if (hashtagMap[keyword]) {
                hashtags.push(...hashtagMap[keyword]);
            }
        });
        return hashtags;
    }
}
exports.InstagramAPI = InstagramAPI;
