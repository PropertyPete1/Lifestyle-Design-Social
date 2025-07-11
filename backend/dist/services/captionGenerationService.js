"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptionGenerationService = void 0;
const logger_1 = require("../utils/logger");
const Video_1 = require("../models/Video");
const Caption_1 = require("../models/Caption");
const Hashtag_1 = require("../models/Hashtag");
const database_1 = require("../config/database");
class CaptionGenerationService {
    constructor() {
        this.videoModel = new Video_1.VideoModel(database_1.pool);
        this.captionModel = new Caption_1.CaptionModel(database_1.pool);
        this.hashtagModel = new Hashtag_1.HashtagModel(database_1.pool);
    }
    async generateCaption(options) {
        try {
            logger_1.logger.info(`Generating caption for video ${options.videoId}`);
            const video = await this.videoModel.findById(options.videoId);
            if (!video) {
                throw new Error('Video not found');
            }
            const template = await this.getCaptionTemplate(video.category, options.tone || 'professional');
            const caption = await this.fillCaptionTemplate(template, video, options);
            let hashtags = [];
            if (options.includeHashtags) {
                hashtags = await this.generateHashtags(video.category, options.tone || 'professional');
            }
            let emojis = [];
            if (options.includeEmojis) {
                emojis = this.getEmojisForCategory(video.category);
            }
            const result = {
                caption,
                hashtags,
                emojis,
                length: caption.length,
                tone: options.tone || 'professional',
                callToAction: template.callToAction,
            };
            await this.captionModel.create({
                videoId: options.videoId,
                content: caption,
                tone: options.tone || 'professional',
                hashtags,
                generatedAt: new Date(),
            });
            logger_1.logger.info(`Generated caption for video ${options.videoId}: ${caption.length} characters`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate caption:', error);
            throw error;
        }
    }
    async getCaptionTemplate(category, tone) {
        try {
            const templates = await this.captionModel.getTemplatesByCategory(category, tone);
            if (templates.length > 0) {
                return templates[Math.floor(Math.random() * templates.length)];
            }
            return this.getDefaultTemplate(category, tone);
        }
        catch (error) {
            logger_1.logger.error('Failed to get caption template:', error);
            return this.getDefaultTemplate(category, tone);
        }
    }
    getDefaultTemplate(category, tone) {
        const templates = {
            'real-estate_professional': {
                id: 'default_professional',
                template: '🏠 {propertyType} in {location} | {price} | {features} | {callToAction}',
                tone: 'professional',
                category: 'real-estate',
                hashtags: ['#realestate', '#luxuryhomes', '#property', '#homesforsale'],
                emojis: ['🏠', '💰', '📍'],
                callToAction: 'DM for more details!',
            },
            'real-estate_casual': {
                id: 'default_casual',
                template: 'Check out this amazing {propertyType} in {location}! {features} {callToAction}',
                tone: 'casual',
                category: 'real-estate',
                hashtags: ['#realestate', '#homes', '#property', '#dreamhome'],
                emojis: ['🏠', '✨', '💫'],
                callToAction: 'Let me know what you think!',
            },
            'cartoon_funny': {
                id: 'default_cartoon',
                template: '😂 Real estate agents be like... {funnyScenario} {callToAction}',
                tone: 'funny',
                category: 'cartoon',
                hashtags: ['#realestatehumor', '#realtorlife', '#funny', '#cartoon'],
                emojis: ['😂', '🤣', '😅'],
                callToAction: 'Tag a realtor friend!',
            },
            'cartoon_professional': {
                id: 'default_cartoon_professional',
                template: 'Real estate humor: {scenario} | {lesson} | {callToAction}',
                tone: 'professional',
                category: 'cartoon',
                hashtags: ['#realestate', '#realtorhumor', '#realestatehumor'],
                emojis: ['🏠', '😊', '💡'],
                callToAction: 'Follow for more insights!',
            },
        };
        const key = `${category}_${tone}`;
        return templates[key] || templates['real-estate_professional'];
    }
    async fillCaptionTemplate(template, video, options) {
        let caption = template.template;
        const replacements = {
            '{propertyType}': video.propertyType || 'Property',
            '{location}': video.location || 'Central Texas',
            '{price}': video.price ? `$${video.price.toLocaleString()}` : 'Price on request',
            '{features}': video.features?.join(' | ') || 'Amazing features',
            '{callToAction}': template.callToAction,
            '{funnyScenario}': this.getRandomFunnyScenario(),
            '{scenario}': this.getRandomScenario(),
            '{lesson}': this.getRandomLesson(),
        };
        for (const [placeholder, value] of Object.entries(replacements)) {
            caption = caption.replace(new RegExp(placeholder, 'g'), value);
        }
        if (options.includeEmojis && template.emojis.length > 0) {
            caption = `${template.emojis.join(' ')} ${caption}`;
        }
        const maxLength = options.maxLength || 2200;
        if (caption.length > maxLength) {
            caption = caption.substring(0, maxLength - 3) + '...';
        }
        return caption;
    }
    async generateHashtags(category, tone) {
        try {
            const hashtags = await this.hashtagModel.getByCategory(category, tone);
            if (hashtags.length > 0) {
                const shuffled = hashtags.sort(() => 0.5 - Math.random());
                return shuffled.slice(0, Math.min(30, hashtags.length));
            }
            return this.getDefaultHashtags(category, tone);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate hashtags:', error);
            return this.getDefaultHashtags(category, tone);
        }
    }
    getDefaultHashtags(category, tone) {
        const defaultHashtags = {
            'real-estate_professional': [
                '#realestate', '#luxuryhomes', '#property', '#homesforsale', '#realestateagent',
                '#luxuryrealestate', '#dreamhome', '#homeselling', '#homebuying', '#realestateinvesting',
                '#centraltexas', '#texasrealestate', '#austinhomes', '#luxuryproperties', '#realestatephotography',
            ],
            'real-estate_casual': [
                '#realestate', '#homes', '#property', '#dreamhome', '#homegoals',
                '#realestateagent', '#homesforsale', '#homebuying', '#homeselling', '#realestateinvesting',
                '#centraltexas', '#texasrealestate', '#austinhomes', '#luxuryhomes', '#realestatephotography',
            ],
            'cartoon_funny': [
                '#realestatehumor', '#realtorlife', '#funny', '#cartoon', '#realestateagent',
                '#realtorhumor', '#realestatefunny', '#realtorproblems', '#realestatecartoon', '#funnyrealtor',
                '#realestatememes', '#realtormemes', '#realestatehumor', '#realtorlife', '#realestatefun',
            ],
            'cartoon_professional': [
                '#realestate', '#realtorhumor', '#realestatehumor', '#realestateagent', '#realtorlife',
                '#realestatecartoon', '#realestatefun', '#realtorhumor', '#realestatefunny', '#realtorproblems',
                '#realestatememes', '#realtormemes', '#realestatehumor', '#realtorlife', '#realestatefun',
            ],
        };
        const key = `${category}_${tone}`;
        return defaultHashtags[key] || defaultHashtags['real-estate_professional'];
    }
    getEmojisForCategory(category) {
        const emojiMap = {
            'real-estate': ['🏠', '💰', '📍', '✨', '💫', '🔥', '💎', '🏡', '🌆', '🌇'],
            'cartoon': ['😂', '🤣', '😅', '😊', '🤪', '😎', '🤔', '💡', '🎯', '🎪'],
        };
        return emojiMap[category] || emojiMap['real-estate'];
    }
    getRandomFunnyScenario() {
        const scenarios = [
            'when clients ask "is this the final price?" for the 10th time',
            'trying to explain why a 2-bedroom house costs $500k',
            'when buyers want to see 50 houses but only buy one',
            'the classic "we love it but need to think about it"',
            'when sellers think their house is worth way more than it is',
            'trying to schedule showings with busy clients',
            'when clients ask if they can paint the walls before closing',
            'the eternal "is this a good investment?" question',
        ];
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }
    getRandomScenario() {
        const scenarios = [
            'Client expectations vs. reality',
            'The art of negotiation',
            'Market timing challenges',
            'Property value assessment',
            'Client communication strategies',
            'Market trend analysis',
            'Property presentation techniques',
            'Investment decision making',
        ];
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }
    getRandomLesson() {
        const lessons = [
            'Always do your research',
            'Patience pays off',
            'Market knowledge is key',
            'Communication is everything',
            'Trust your instincts',
            'Timing is crucial',
            'Quality over quantity',
            'Relationships matter',
        ];
        return lessons[Math.floor(Math.random() * lessons.length)];
    }
    async getCaptionStats() {
        try {
            const stats = await this.captionModel.getStats();
            return {
                totalGenerated: stats.totalCaptions || 0,
                averageLength: stats.averageLength || 0,
                mostUsedTone: stats.mostUsedTone || 'professional',
                mostUsedHashtags: stats.mostUsedHashtags || [],
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get caption stats:', error);
            throw error;
        }
    }
    async saveCustomTemplate(template) {
        try {
            const result = await this.captionModel.createTemplate(template);
            logger_1.logger.info(`Saved custom caption template: ${result.id}`);
            return result.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to save custom template:', error);
            throw error;
        }
    }
}
exports.CaptionGenerationService = CaptionGenerationService;
exports.default = CaptionGenerationService;
//# sourceMappingURL=captionGenerationService.js.map