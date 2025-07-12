"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const captionGenerationService_1 = require("../services/captionGenerationService");
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const captionService = new captionGenerationService_1.CaptionGenerationService();
const videoModel = new Video_1.VideoModel(database_1.pool);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
router.post('/generate', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { videoId, platform, style, includeHashtags, customPrompt } = req.body;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const caption = await captionService.generateCaption({
            videoId,
            tone: style || 'professional',
            includeHashtags: includeHashtags !== false,
        });
        res.json({
            caption: caption.caption,
            hashtags: caption.hashtags,
            tone: caption.tone,
            length: caption.length,
            emojis: caption.emojis
        });
        return;
    }
    catch (error) {
        console.error('Caption generation error:', error);
        res.status(500).json({ error: 'Failed to generate caption' });
        return;
    }
});
router.post('/generate-batch', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { videoIds, platform, style, includeHashtags } = req.body;
        if (!videoIds || !Array.isArray(videoIds)) {
            res.status(400).json({ error: 'Video IDs array is required' });
            return;
        }
        const captions = await Promise.all(videoIds.map(async (videoId) => {
            try {
                const caption = await captionService.generateCaption({
                    videoId,
                    tone: style || 'professional',
                    includeHashtags: includeHashtags !== false
                });
                return {
                    videoId,
                    success: true,
                    caption: caption.caption,
                    hashtags: caption.hashtags,
                    tone: caption.tone,
                    length: caption.length
                };
            }
            catch (error) {
                return {
                    videoId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to generate caption'
                };
            }
        }));
        res.json({
            captions,
            total: videoIds.length,
            successful: captions.filter(c => c.success).length,
            failed: captions.filter(c => !c.success).length
        });
        return;
    }
    catch (error) {
        console.error('Batch caption generation error:', error);
        res.status(500).json({ error: 'Failed to generate batch captions' });
        return;
    }
});
router.get('/templates', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, tone } = req.query;
        const templates = getCaptionTemplates({
            category: category,
            tone: tone,
        });
        res.json({ templates });
    }
    catch (error) {
        logger_1.logger.error('Get caption templates error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/hashtags', auth_1.authenticateToken, async (req, res) => {
    try {
        const { content, category = 'real-estate', location, propertyType, price, count = 20, } = req.body;
        const hashtags = generateHashtags({
            content,
            category,
            location,
            propertyType,
            price,
            count,
        });
        res.json({
            hashtags,
            count: hashtags.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Generate hashtags error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/hashtag-suggestions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, location, propertyType } = req.query;
        const suggestions = getHashtagSuggestions({
            category: category,
            location: location,
            propertyType: propertyType,
        });
        res.json({ suggestions });
    }
    catch (error) {
        logger_1.logger.error('Get hashtag suggestions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/optimize', auth_1.authenticateToken, async (req, res) => {
    try {
        const { caption, videoId, optimizationType = 'engagement', targetLength, includeHashtags = true, } = req.body;
        let video = null;
        if (videoId) {
            video = await videoModel.findById(videoId);
        }
        const optimizedCaption = optimizeCaption({
            caption,
            video,
            optimizationType,
            targetLength,
            includeHashtags,
        });
        res.json({
            originalCaption: caption,
            optimizedCaption,
            improvements: [
                'Enhanced engagement potential',
                'Better hashtag strategy',
                'Improved readability',
            ],
        });
    }
    catch (error) {
        logger_1.logger.error('Optimize caption error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
function generateCaption(options) {
    const { video, tone, style, includeHashtags, maxLength, includeCallToAction } = options;
    let caption = '';
    if (video.category === 'real-estate') {
        caption = `🏠 ${video.title}\n\n`;
        if (video.location) {
            caption += `📍 Location: ${video.location}\n`;
        }
        if (video.propertyType) {
            caption += `🏘️ Type: ${video.propertyType}\n`;
        }
        if (video.price) {
            caption += `💰 Price: $${video.price.toLocaleString()}\n`;
        }
        caption += `\n${video.description || 'Check out this amazing property!'}`;
    }
    else {
        caption = `🎬 ${video.title}\n\n`;
        caption += video.description || 'Fun real estate content coming your way!';
    }
    if (includeCallToAction) {
        caption += '\n\n💬 What do you think? Drop a comment below! 👇';
    }
    if (includeHashtags) {
        const hashtags = generateHashtags({
            content: caption,
            category: video.category,
            location: video.location,
            propertyType: video.propertyType,
            price: video.price,
            count: 15,
        });
        caption += `\n\n${hashtags.join(' ')}`;
    }
    if (caption.length > maxLength) {
        caption = caption.substring(0, maxLength - 3) + '...';
    }
    return caption;
}
function generateHashtags(options) {
    const { category, location, propertyType, price, count } = options;
    const hashtags = [];
    if (category === 'real-estate') {
        hashtags.push('#realestate', '#homes', '#property', '#realestateagent', '#homesforsale', '#luxuryhomes', '#dreamhome', '#homebuying', '#realestateinvesting');
    }
    else {
        hashtags.push('#cartoon', '#funny', '#realestatehumor', '#realtorlife', '#realestatecomedy', '#funnyrealtor', '#realestatejokes');
    }
    if (location) {
        const locationParts = location.split(',').map(part => part.trim());
        locationParts.forEach(part => {
            hashtags.push(`#${part.toLowerCase().replace(/\s+/g, '')}`);
        });
    }
    if (propertyType) {
        hashtags.push(`#${propertyType.toLowerCase()}`);
    }
    if (price) {
        if (price > 1000000) {
            hashtags.push('#luxury', '#milliondollarhome');
        }
        else if (price > 500000) {
            hashtags.push('#midrange', '#affordableluxury');
        }
        else {
            hashtags.push('#affordable', '#starterhome');
        }
    }
    return [...new Set(hashtags)].slice(0, count);
}
function getCaptionTemplates(options) {
    const { category, tone } = options;
    const templates = [
        {
            id: 'luxury-property',
            name: 'Luxury Property Showcase',
            template: '🏠 {title}\n\n📍 {location}\n🏘️ {propertyType}\n💰 {price}\n\n{description}\n\n#luxuryhomes #realestate #dreamhome',
            category: 'real-estate',
            tone: 'luxury',
        },
        {
            id: 'casual-property',
            name: 'Casual Property Tour',
            template: 'Check out this amazing {propertyType} in {location}! {description}\n\nWhat do you think? 👇\n\n#realestate #homes #property',
            category: 'real-estate',
            tone: 'casual',
        },
        {
            id: 'funny-cartoon',
            name: 'Funny Real Estate Cartoon',
            template: '😂 {title}\n\n{description}\n\nReal estate life be like... 😅\n\n#realestatehumor #funnyrealtor #cartoon',
            category: 'cartoon',
            tone: 'friendly',
        },
    ];
    return templates.filter(template => {
        if (category && template.category !== category)
            return false;
        if (tone && template.tone !== tone)
            return false;
        return true;
    });
}
function getHashtagSuggestions(options) {
    const { category, location, propertyType } = options;
    const suggestions = {
        realEstate: [
            '#realestate', '#homes', '#property', '#realestateagent',
            '#homesforsale', '#luxuryhomes', '#dreamhome', '#homebuying',
            '#realestateinvesting', '#openhouse', '#justlisted',
        ],
        cartoon: [
            '#cartoon', '#funny', '#realestatehumor', '#realtorlife',
            '#realestatecomedy', '#funnyrealtor', '#realestatejokes',
            '#realtorproblems', '#realestatememes',
        ],
        locations: location ? [`#${location.toLowerCase().replace(/\s+/g, '')}`] : [],
        propertyTypes: propertyType ? [`#${propertyType.toLowerCase()}`] : [],
    };
    return suggestions;
}
function optimizeCaption(options) {
    const { caption, optimizationType, targetLength, includeHashtags } = options;
    let optimized = caption;
    if (optimizationType === 'engagement') {
        optimized = optimized.replace(/\./g, ' 😊');
        optimized += '\n\n💬 What do you think? Drop a comment below! 👇';
    }
    if (targetLength && optimized.length > targetLength) {
        optimized = optimized.substring(0, targetLength - 3) + '...';
    }
    return optimized;
}
exports.default = router;
//# sourceMappingURL=captions.js.map