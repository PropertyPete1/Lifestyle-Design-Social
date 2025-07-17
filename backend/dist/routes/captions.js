"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const captionGenerationService_1 = require("../services/captionGenerationService");
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const captionService = captionGenerationService_1.captionGenerationService;
router.post('/generate', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const { videoId, platform, style: _style, includeHashtags: _includeHashtags, customPrompt: _customPrompt } = req.body;
        if (!videoId) {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        const video = await Video_1.Video.findOne({ _id: videoId, userId });
        if (!video) {
            return res.status(404).json({ error: 'Video not found or access denied' });
        }
        const caption = await captionService.generateCaptionAndHashtags(userId, videoId, platform || 'instagram', { tone: 'professional' });
        return res.json({
            success: true,
            caption: caption.caption,
            hashtags: caption.hashtags,
        });
    }
    catch (error) {
        logger_1.logger.error('Generate caption error:', error);
        return res.status(500).json({ error: 'Failed to generate caption' });
    }
});
router.post('/generate-batch', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { videoIds, platform, style: _style, includeHashtags: _includeHashtags } = req.body;
        if (!videoIds || !Array.isArray(videoIds)) {
            return res.status(400).json({ error: 'Video IDs array is required' });
        }
        const captions = await Promise.all(videoIds.map(async (videoId) => {
            try {
                await (0, database_1.connectToDatabase)();
                const video = await Video_1.Video.findOne({ _id: videoId, userId });
                if (!video) {
                    throw new Error('Video not found or access denied');
                }
                const caption = await captionService.generateCaptionAndHashtags(userId, videoId, platform || 'instagram', { tone: 'professional' });
                return {
                    videoId,
                    success: true,
                    caption: caption.caption,
                    hashtags: caption.hashtags,
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
        return res.json({
            captions,
            total: videoIds.length,
            successful: captions.filter(c => c.success).length,
            failed: captions.filter(c => !c.success).length
        });
    }
    catch (error) {
        logger_1.logger.error('Batch caption generation error:', error);
        return res.status(500).json({ error: 'Failed to generate batch captions' });
    }
});
router.get('/templates', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, tone } = req.query;
        const templates = getCaptionTemplates({
            category: category,
            tone: tone,
        });
        return res.json({ templates });
    }
    catch (error) {
        logger_1.logger.error('Get caption templates error:', error);
        return res.status(500).json({ error: 'Server error' });
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
        return res.json({
            hashtags,
            count: hashtags.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Generate hashtags error:', error);
        return res.status(500).json({ error: 'Server error' });
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
        return res.json({ suggestions });
    }
    catch (error) {
        logger_1.logger.error('Get hashtag suggestions error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
router.post('/optimize', auth_1.authenticateToken, async (req, res) => {
    try {
        const { caption, videoId, optimizationType = 'engagement', targetLength, includeHashtags = true, } = req.body;
        let video = null;
        if (videoId) {
            await (0, database_1.connectToDatabase)();
            video = await Video_1.Video.findOne({ _id: videoId });
        }
        const optimizedCaption = optimizeCaption({
            caption,
            video,
            optimizationType,
            targetLength,
            includeHashtags,
        });
        return res.json({
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
        return res.status(500).json({ error: 'Server error' });
    }
});
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
    const { category: _category, location, propertyType } = options;
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
    const { caption, optimizationType, targetLength, includeHashtags: _includeHashtags } = options;
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
