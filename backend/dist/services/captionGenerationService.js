"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.captionGenerationService = exports.CaptionGenerationService = void 0;
const logger_1 = require("../utils/logger");
const Video_1 = require("../models/Video");
const Caption_1 = require("../models/Caption");
const Hashtag_1 = require("../models/Hashtag");
class CaptionGenerationService {
    constructor() {
        this.videoModel = Video_1.Video;
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
            logger_1.logger.debug('Generated caption', {
                userId: options.videoId,
                captionLength: caption.length,
                hashtagCount: hashtags.length,
                tone: options.tone || 'professional'
            });
            try {
                await Caption_1.Caption.create({
                    userId: options.videoId,
                    videoId: options.videoId,
                    content: caption,
                    tone: options.tone || 'professional',
                    hashtags,
                    emojis,
                    length: caption.length,
                    callToAction: template.callToAction,
                    category: 'real_estate',
                    isTemplate: false,
                    generatedAt: new Date()
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to store generated caption:', error);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate caption:', error);
            throw error;
        }
    }
    async getCaptionTemplate(category, tone) {
        try {
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
        const template = templates[key] || templates['real-estate_professional'];
        if (!template) {
            return templates['real-estate_professional'];
        }
        return template;
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
            const topHashtags = await Hashtag_1.Hashtag.find({
                category: category === 'real_estate' ? 'real_estate' : 'trending',
                isActive: true,
                'performance.averageEngagement': { $gte: 0.05 }
            })
                .sort({ 'performance.averageEngagement': -1 })
                .limit(30);
            if (topHashtags.length > 0) {
                return topHashtags.map((doc) => doc.hashtag);
            }
            const { HashtagLibrary } = await Promise.resolve().then(() => __importStar(require('../models/HashtagLibrary')));
            const hashtagDocs = await HashtagLibrary.find({
                category: category === 'real_estate' ? 'real_estate' : 'trending',
                isActive: true
            }).limit(30);
            if (hashtagDocs.length > 0) {
                const allHashtags = hashtagDocs.flatMap((doc) => doc.hashtags);
                const shuffled = allHashtags.sort(() => 0.5 - Math.random());
                return shuffled.slice(0, Math.min(30, shuffled.length));
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
        const hashtags = defaultHashtags[key] || defaultHashtags['real-estate_professional'];
        return hashtags || defaultHashtags['real-estate_professional'] || [];
    }
    getEmojisForCategory(category) {
        const emojiMap = {
            'real-estate': ['🏠', '💰', '📍', '✨', '💫', '🔥', '💎', '🏡', '🌆', '🌇'],
            'cartoon': ['😂', '🤣', '😅', '😊', '🤪', '😎', '🤔', '💡', '🎯', '🎪'],
        };
        const emojis = emojiMap[category] || emojiMap['real-estate'];
        return emojis || emojiMap['real-estate'] || [];
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
        const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
        return selected || scenarios[0] || 'when clients ask "is this the final price?" for the 10th time';
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
        const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
        return selected || scenarios[0] || 'Client expectations vs. reality';
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
        const lesson = lessons[Math.floor(Math.random() * lessons.length)];
        return lesson || lessons[0] || 'Always do your research';
    }
    async getCaptionStats() {
        try {
            const captionStats = await Caption_1.Caption.aggregate([
                { $group: {
                        _id: null,
                        totalCaptions: { $sum: 1 },
                        averageLength: { $avg: '$length' },
                        tones: { $push: '$tone' },
                        allHashtags: { $push: '$hashtags' }
                    } }
            ]);
            if (captionStats.length === 0) {
                const { Post } = await Promise.resolve().then(() => __importStar(require('../models/Post')));
                const posts = await Post.find({ autoGenerated: true });
                if (posts.length === 0) {
                    return {
                        totalGenerated: 0,
                        averageLength: 0,
                        mostUsedTone: 'professional',
                        mostUsedHashtags: [],
                    };
                }
                const totalGenerated = posts.length;
                const averageLength = posts.reduce((sum, post) => sum + (post.content?.length || 0), 0) / totalGenerated;
                const hashtagCounts = {};
                posts.forEach((post) => {
                    post.hashtags?.forEach((hashtag) => {
                        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
                    });
                });
                const mostUsedHashtags = Object.entries(hashtagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([hashtag]) => hashtag);
                return {
                    totalGenerated,
                    averageLength: Math.round(averageLength),
                    mostUsedTone: 'professional',
                    mostUsedHashtags,
                };
            }
            const stats = captionStats[0];
            const toneCount = {};
            stats.tones.forEach((tone) => {
                toneCount[tone] = (toneCount[tone] || 0) + 1;
            });
            const mostUsedTone = Object.entries(toneCount)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'professional';
            const hashtagCounts = {};
            stats.allHashtags.flat().forEach((hashtag) => {
                hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
            });
            const mostUsedHashtags = Object.entries(hashtagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([hashtag]) => hashtag);
            return {
                totalGenerated: stats.totalCaptions,
                averageLength: Math.round(stats.averageLength),
                mostUsedTone,
                mostUsedHashtags,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get caption stats:', error);
            throw error;
        }
    }
    async saveCustomTemplate(template) {
        try {
            const templateId = `custom_${Date.now()}`;
            logger_1.logger.info(`Would save custom caption template: ${templateId}`, template);
            return templateId;
        }
        catch (error) {
            logger_1.logger.error('Failed to save custom template:', error);
            throw new Error('Failed to save custom caption template');
        }
    }
    async generateTrendingHashtags(keywords, maxCount = 30) {
        try {
            logger_1.logger.info(`Generating trending hashtags for keywords: ${keywords.join(', ')}`);
            const hashtags = await this.generateHashtagsFromKeywords(keywords, maxCount);
            logger_1.logger.info(`Generated ${hashtags.length} trending hashtags`);
            return hashtags;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate trending hashtags:', error);
            return this.getDefaultHashtagsByCount(maxCount);
        }
    }
    async generateHashtagsFromKeywords(keywords, maxCount) {
        const baseHashtags = [
            '#realestate', '#realtor', '#property', '#home', '#house',
            '#listing', '#forsale', '#investment', '#dreamhome', '#newlisting'
        ];
        const keywordHashtags = keywords.map(keyword => `#${keyword.toLowerCase().replace(/\s+/g, '')}`);
        const combinedHashtags = [...baseHashtags, ...keywordHashtags];
        return combinedHashtags.slice(0, maxCount);
    }
    getDefaultHashtagsByCount(maxCount) {
        const defaultHashtags = [
            '#realestate', '#property', '#home', '#realtor', '#listing',
            '#forsale', '#dreamhome', '#investment', '#newlisting', '#homebuying'
        ];
        return defaultHashtags.slice(0, maxCount);
    }
    async generateCaptionAndHashtags(_userId, videoId, _platform, options) {
        return this.generateCaption({
            videoId,
            tone: options?.tone || 'professional',
            includeHashtags: true,
            ...options
        });
    }
}
exports.CaptionGenerationService = CaptionGenerationService;
exports.captionGenerationService = new CaptionGenerationService();
exports.default = CaptionGenerationService;
