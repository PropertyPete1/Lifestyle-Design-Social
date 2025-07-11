"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const videoModel = new Video_1.VideoModel(database_1.pool);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId, tone = 'professional', style = 'engaging', includeHashtags = true, maxLength = 2200, includeCallToAction = true, } = req.body;
        const video = await videoModel.findById(videoId);
        if (!video || video.userId !== userId) {
            return res.status(404).json({ error: 'Video not found' });
        }
        const caption = generateCaption({
            video,
            tone,
            style,
            includeHashtags,
            maxLength,
            includeCallToAction,
        });
        logger_1.logger.info(`Generated caption for video: ${video.id} by user ${userId}`);
        res.json({
            caption,
            video: {
                id: video.id,
                title: video.title,
                category: video.category,
                propertyType: video.propertyType,
                location: video.location,
                price: video.price,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Generate caption error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/generate-batch', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { videoIds, tone = 'professional', style = 'engaging', includeHashtags = true, maxLength = 2200, includeCallToAction = true, } = req.body;
        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ error: 'Video IDs array is required' });
        }
        const captions = [];
        for (const videoId of videoIds) {
            const video = await videoModel.findById(videoId);
            if (video && video.userId === userId) {
                const caption = generateCaption({
                    video,
                    tone,
                    style,
                    includeHashtags,
                    maxLength,
                    includeCallToAction,
                });
                captions.push({
                    videoId,
                    caption,
                    video: {
                        id: video.id,
                        title: video.title,
                        category: video.category,
                    }
                });
            }
        }
        logger_1.logger.info(`Generated ${captions.length} captions for user ${userId}`);
        res.json({
            captions,
            total: captions.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Generate batch captions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/templates', authenticateToken, async (req, res) => {
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
router.post('/hashtags', authenticateToken, async (req, res) => {
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
router.get('/hashtag-suggestions', authenticateToken, async (req, res) => {
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
router.post('/optimize', authenticateToken, async (req, res) => {
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