"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiPlatformService = void 0;
const logger_1 = require("../utils/logger");
const instagramService_1 = require("./instagramService");
const tiktokService_1 = require("./tiktokService");
const youtubeService_1 = require("./youtubeService");
const captionGenerationService_1 = require("./captionGenerationService");
const videoProcessingService_1 = require("./videoProcessingService");
const User_1 = require("../models/User");
class MultiPlatformService {
    constructor() {
        this.instagramService = new instagramService_1.InstagramService();
        this.tiktokService = new tiktokService_1.TikTokService();
        this.youtubeService = new youtubeService_1.YouTubeService();
        this.captionService = new captionGenerationService_1.CaptionGenerationService();
        this.videoService = new videoProcessingService_1.VideoProcessingService();
        this.userModel = User_1.UserModel;
    }
    async postToMultiplePlatforms(options) {
        try {
            logger_1.logger.info(`Posting video to multiple platforms for user ${options.userId}`);
            const user = await this.userModel.findById(options.userId);
            if (!user) {
                throw new Error('User not found');
            }
            const results = {};
            const errors = [];
            let totalEngagement = 0;
            const processedVideos = await this.processVideoForPlatforms(options.videoPath, options.platforms);
            if (options.platforms.instagram && user.instagramAccessToken) {
                try {
                    const instagramCaption = await this.generatePlatformCaption('instagram', options);
                    const instagramResult = await this.instagramService.postVideo({
                        videoPath: processedVideos.instagram || options.videoPath,
                        caption: instagramCaption.caption,
                        hashtags: instagramCaption.hashtags,
                        accessToken: user.instagramAccessToken,
                        userId: options.userId,
                    });
                    if (instagramResult.success) {
                        results.instagram = instagramResult;
                        totalEngagement += this.calculateEngagement(instagramResult.engagementMetrics);
                    }
                    else {
                        errors.push(`Instagram: ${instagramResult.error}`);
                    }
                }
                catch (error) {
                    errors.push(`Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            if (options.platforms.tiktok && user.tiktokAccessToken) {
                try {
                    const tiktokCaption = await this.generatePlatformCaption('tiktok', options);
                    const tiktokResult = await this.tiktokService.postVideo({
                        videoPath: processedVideos.tiktok || options.videoPath,
                        caption: tiktokCaption.caption,
                        hashtags: tiktokCaption.hashtags,
                        accessToken: user.tiktokAccessToken,
                        userId: options.userId,
                    });
                    if (tiktokResult.success) {
                        results.tiktok = tiktokResult;
                        totalEngagement += this.calculateEngagement(tiktokResult.engagementMetrics);
                    }
                    else {
                        errors.push(`TikTok: ${tiktokResult.error}`);
                    }
                }
                catch (error) {
                    errors.push(`TikTok: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            if (options.platforms.youtube && user.youtubeAccessToken) {
                try {
                    const youtubeContent = await this.generateYouTubeContent(options);
                    const youtubeResult = await this.youtubeService.postVideo({
                        videoPath: processedVideos.youtube || options.videoPath,
                        title: youtubeContent.title,
                        description: youtubeContent.description,
                        tags: youtubeContent.tags,
                        accessToken: user.youtubeAccessToken,
                        userId: options.userId,
                    });
                    if (youtubeResult.success) {
                        results.youtube = youtubeResult;
                        totalEngagement += this.calculateEngagement(youtubeResult.engagementMetrics);
                    }
                    else {
                        errors.push(`YouTube: ${youtubeResult.error}`);
                    }
                }
                catch (error) {
                    errors.push(`YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            const success = Object.keys(results).length > 0;
            logger_1.logger.info(`Multi-platform posting completed. Success: ${success}, Errors: ${errors.length}`);
            return {
                success,
                results,
                errors,
                totalEngagement,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to post to multiple platforms:', error);
            return {
                success: false,
                results: {},
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                totalEngagement: 0,
            };
        }
    }
    async processVideoForPlatforms(videoPath, platforms) {
        const processedVideos = {};
        if (platforms.instagram) {
            try {
                const instagramSettings = {
                    maxDuration: 60,
                    maxFileSize: 100 * 1024 * 1024,
                    supportedFormats: ['mp4', 'mov'],
                    aspectRatio: '9:16'
                };
                const result = await this.videoService.processVideo(videoPath, 'system', {
                    compressVideo: true,
                    generateThumbnail: true,
                    maxDuration: instagramSettings.maxDuration,
                    maxFileSize: instagramSettings.maxFileSize,
                });
                processedVideos.instagram = result.processedFilePath || videoPath;
            }
            catch (error) {
                logger_1.logger.error('Failed to process video for Instagram:', error);
                processedVideos.instagram = videoPath;
            }
        }
        if (platforms.tiktok) {
            try {
                const tiktokSettings = this.tiktokService.getVideoRequirements();
                const result = await this.videoService.processVideo(videoPath, 'system', {
                    compressVideo: true,
                    generateThumbnail: true,
                    maxDuration: tiktokSettings.maxDuration,
                    maxFileSize: tiktokSettings.maxFileSize,
                });
                processedVideos.tiktok = result.processedFilePath || videoPath;
            }
            catch (error) {
                logger_1.logger.error('Failed to process video for TikTok:', error);
                processedVideos.tiktok = videoPath;
            }
        }
        if (platforms.youtube) {
            try {
                const youtubeSettings = this.youtubeService.getVideoRequirements();
                const result = await this.videoService.processVideo(videoPath, 'system', {
                    compressVideo: true,
                    generateThumbnail: true,
                    maxDuration: youtubeSettings.maxDuration,
                    maxFileSize: youtubeSettings.maxFileSize,
                });
                processedVideos.youtube = result.processedFilePath || videoPath;
            }
            catch (error) {
                logger_1.logger.error('Failed to process video for YouTube:', error);
                processedVideos.youtube = videoPath;
            }
        }
        return processedVideos;
    }
    async generatePlatformCaption(platform, options) {
        if (options.caption) {
            return {
                caption: options.caption,
                hashtags: options.hashtags || [],
            };
        }
        const captionOptions = {
            videoId: 'temp',
            tone: options.tone || 'professional',
            includeHashtags: true,
            maxLength: this.getPlatformMaxLength(platform),
            includeEmojis: true,
        };
        const generatedCaption = await this.captionService.generateCaption(captionOptions);
        const platformHashtags = this.getPlatformHashtags(platform, options.category || 'real-estate');
        const allHashtags = [...generatedCaption.hashtags, ...platformHashtags];
        return {
            caption: generatedCaption.caption,
            hashtags: allHashtags.slice(0, this.getPlatformHashtagLimit(platform)),
        };
    }
    async generateYouTubeContent(options) {
        const baseCaption = options.caption || 'Amazing real estate content!';
        const category = options.category || 'real-estate';
        const title = this.youtubeService.generateYouTubeTitle(baseCaption, category);
        const description = this.youtubeService.generateYouTubeDescription(baseCaption, options.hashtags || []);
        const tags = this.youtubeService.generateYouTubeTags(category);
        return { title, description, tags };
    }
    getPlatformMaxLength(platform) {
        const maxLengths = {
            instagram: 2200,
            tiktok: 150,
            youtube: 5000,
        };
        return maxLengths[platform] || 2200;
    }
    getPlatformHashtagLimit(platform) {
        const limits = {
            instagram: 30,
            tiktok: 20,
            youtube: 15,
        };
        return limits[platform] || 30;
    }
    getPlatformHashtags(platform, category) {
        const platformHashtags = {
            instagram: {
                'real-estate': ['#realestate', '#luxuryhomes', '#property'],
                'cartoon': ['#realestatehumor', '#realtorlife', '#funny'],
            },
            tiktok: {
                'real-estate': ['#realestate', '#luxuryhomes', '#property', '#fyp', '#foryou'],
                'cartoon': ['#realestatehumor', '#realtorlife', '#funny', '#fyp', '#foryou'],
            },
            youtube: {
                'real-estate': ['#realestate', '#luxuryhomes', '#property'],
                'cartoon': ['#realestatehumor', '#realtorlife', '#funny'],
            },
        };
        return platformHashtags[platform]?.[category] || [];
    }
    calculateEngagement(metrics) {
        if (!metrics)
            return 0;
        return (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.views || 0) / 100;
    }
    getPlatformRequirements() {
        return {
            instagram: {
                maxDuration: 60,
                maxFileSize: 100 * 1024 * 1024,
                recommendedDimensions: { width: 1080, height: 1920 },
                recommendedBitrate: 3500,
            },
            tiktok: this.tiktokService.getVideoRequirements(),
            youtube: this.youtubeService.getVideoRequirements(),
        };
    }
    async validatePlatformCredentials(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const validations = {};
            if (user.instagramAccessToken) {
                validations.instagram = await this.instagramService.validateCredentials(user.instagramAccessToken);
            }
            if (user.tiktokAccessToken) {
                validations.tiktok = await this.tiktokService.validateCredentials(user.tiktokAccessToken);
            }
            if (user.youtubeAccessToken) {
                validations.youtube = await this.youtubeService.validateCredentials(user.youtubeAccessToken);
            }
            return validations;
        }
        catch (error) {
            logger_1.logger.error('Failed to validate platform credentials:', error);
            return {
                instagram: false,
                tiktok: false,
                youtube: false
            };
        }
    }
    async getOptimalPostingTimes(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const times = {};
            if (user.instagramAccessToken) {
                times.instagram = await this.instagramService.getOptimalPostingTimes(user.instagramAccessToken);
            }
            if (user.tiktokAccessToken) {
                times.tiktok = await this.tiktokService.getOptimalPostingTimes(user.tiktokAccessToken);
            }
            if (user.youtubeAccessToken) {
                times.youtube = await this.youtubeService.getOptimalPostingTimes(user.youtubeAccessToken);
            }
            return times;
        }
        catch (error) {
            logger_1.logger.error('Failed to get optimal posting times:', error);
            return {
                instagram: ['9:00 AM', '12:00 PM', '6:00 PM'],
                tiktok: ['6:00 AM', '10:00 AM', '7:00 PM'],
                youtube: ['2:00 PM', '4:00 PM', '8:00 PM']
            };
        }
    }
    async getPlatformStats(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const stats = {};
            if (user.instagramAccessToken) {
                try {
                    const accountInfo = await this.instagramService.getAccountInfo(user.instagramAccessToken);
                    stats.instagram = accountInfo;
                }
                catch (error) {
                    logger_1.logger.error('Failed to get Instagram stats:', error);
                }
            }
            if (user.tiktokAccessToken) {
                try {
                    const accountInfo = await this.tiktokService.getAccountInfo(user.tiktokAccessToken);
                    stats.tiktok = accountInfo;
                }
                catch (error) {
                    logger_1.logger.error('Failed to get TikTok stats:', error);
                }
            }
            if (user.youtubeAccessToken) {
                try {
                    const accountInfo = await this.youtubeService.getAccountInfo(user.youtubeAccessToken);
                    stats.youtube = accountInfo;
                }
                catch (error) {
                    logger_1.logger.error('Failed to get YouTube stats:', error);
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Failed to get platform stats:', error);
            return {
                instagram: { followers: 0, posts: 0, engagement: 0 },
                tiktok: { followers: 0, posts: 0, engagement: 0 },
                youtube: { subscribers: 0, videos: 0, views: 0 }
            };
        }
    }
}
exports.MultiPlatformService = MultiPlatformService;
exports.default = MultiPlatformService;
//# sourceMappingURL=multiPlatformService.js.map