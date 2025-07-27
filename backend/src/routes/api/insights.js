"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const youtubeScraper_1 = require("../../services/youtubeScraper");
const instagramScraper_1 = require("../../services/instagramScraper");
const smartRepost_1 = require("../../services/smartRepost");
const PostInsights_1 = __importDefault(require("../../models/PostInsights"));
const TopHashtags_1 = __importDefault(require("../../models/TopHashtags"));
const router = (0, express_1.Router)();
/**
 * POST /api/insights/scrape/youtube
 * Scrape YouTube channel for top performing videos
 */
router.post('/scrape/youtube', async (req, res) => {
    try {
        const { apiKey, channelId, refreshToken } = req.body;
        if (!apiKey || !channelId) {
            return res.status(400).json({
                error: 'YouTube API key and channel ID are required'
            });
        }
        const scraper = new youtubeScraper_1.YouTubeScraper(apiKey, channelId, refreshToken);
        const result = await scraper.performFullScrape();
        res.json({
            success: true,
            message: 'YouTube scraping completed successfully',
            data: result
        });
    }
    catch (error) {
        console.error('YouTube scraping error:', error);
        res.status(500).json({
            error: 'Failed to scrape YouTube channel',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/insights/scrape/instagram
 * Scrape Instagram page for top performing videos
 */
router.post('/scrape/instagram', async (req, res) => {
    try {
        const { accessToken, pageId } = req.body;
        if (!accessToken || !pageId) {
            return res.status(400).json({
                error: 'Instagram access token and page ID are required'
            });
        }
        const scraper = new instagramScraper_1.InstagramScraper(accessToken, pageId);
        const result = await scraper.performFullScrape();
        res.json({
            success: true,
            message: 'Instagram scraping completed successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Instagram scraping error:', error);
        res.status(500).json({
            error: 'Failed to scrape Instagram page',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/insights/scrape/all
 * Scrape both YouTube and Instagram
 */
router.post('/scrape/all', async (req, res) => {
    try {
        const { youtube, instagram } = req.body;
        const results = {
            youtube: null,
            instagram: null,
            totalVideosScraped: 0,
            totalHashtagsUpdated: 0
        };
        // Scrape YouTube if credentials provided
        if ((youtube === null || youtube === void 0 ? void 0 : youtube.apiKey) && (youtube === null || youtube === void 0 ? void 0 : youtube.channelId)) {
            try {
                const ytScraper = new youtubeScraper_1.YouTubeScraper(youtube.apiKey, youtube.channelId, youtube.refreshToken);
                results.youtube = await ytScraper.performFullScrape();
                results.totalVideosScraped += results.youtube.videosScraped;
                results.totalHashtagsUpdated += results.youtube.hashtagsUpdated;
            }
            catch (ytError) {
                console.error('YouTube scraping failed:', ytError);
                results.youtube = { error: 'Failed to scrape YouTube' };
            }
        }
        // Scrape Instagram if credentials provided
        if ((instagram === null || instagram === void 0 ? void 0 : instagram.accessToken) && (instagram === null || instagram === void 0 ? void 0 : instagram.pageId)) {
            try {
                const igScraper = new instagramScraper_1.InstagramScraper(instagram.accessToken, instagram.pageId);
                results.instagram = await igScraper.performFullScrape();
                results.totalVideosScraped += results.instagram.videosScraped;
                results.totalHashtagsUpdated += results.instagram.hashtagsUpdated;
            }
            catch (igError) {
                console.error('Instagram scraping failed:', igError);
                results.instagram = { error: 'Failed to scrape Instagram' };
            }
        }
        res.json({
            success: true,
            message: 'Scraping process completed',
            data: results
        });
    }
    catch (error) {
        console.error('Full scraping error:', error);
        res.status(500).json({
            error: 'Failed to complete scraping process',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/insights/videos
 * Get scraped video insights with pagination
 */
router.get('/videos', async (req, res) => {
    try {
        const { platform, page = 1, limit = 20, sortBy = 'performanceScore', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = platform ? { platform } : {};
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const videos = await PostInsights_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await PostInsights_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                videos,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching video insights:', error);
        res.status(500).json({
            error: 'Failed to fetch video insights',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/insights/hashtags
 * Get top performing hashtags
 */
router.get('/hashtags', async (req, res) => {
    try {
        const { platform, limit = 50, sortBy = 'avgViewScore', sortOrder = 'desc' } = req.query;
        const query = platform ? { platform } : {};
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const hashtags = await TopHashtags_1.default.find(query)
            .sort(sort)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: hashtags
        });
    }
    catch (error) {
        console.error('Error fetching top hashtags:', error);
        res.status(500).json({
            error: 'Failed to fetch top hashtags',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/insights/analytics
 * Get insights analytics summary
 */
router.get('/analytics', async (req, res) => {
    try {
        const [totalVideos, youtubeVideos, instagramVideos, totalHashtags, repostEligible, reposted] = await Promise.all([
            PostInsights_1.default.countDocuments(),
            PostInsights_1.default.countDocuments({ platform: 'youtube' }),
            PostInsights_1.default.countDocuments({ platform: 'instagram' }),
            TopHashtags_1.default.countDocuments(),
            PostInsights_1.default.countDocuments({ repostEligible: true, reposted: false }),
            PostInsights_1.default.countDocuments({ reposted: true })
        ]);
        // Get top performing video per platform
        const topYouTube = await PostInsights_1.default.findOne({ platform: 'youtube' })
            .sort({ performanceScore: -1 })
            .select('videoId performanceScore views likes title')
            .lean();
        const topInstagram = await PostInsights_1.default.findOne({ platform: 'instagram' })
            .sort({ performanceScore: -1 })
            .select('videoId performanceScore views likes title')
            .lean();
        // Get average performance scores
        const avgPerformance = await PostInsights_1.default.aggregate([
            {
                $group: {
                    _id: '$platform',
                    avgPerformanceScore: { $avg: '$performanceScore' },
                    avgViews: { $avg: '$views' },
                    avgLikes: { $avg: '$likes' }
                }
            }
        ]);
        res.json({
            success: true,
            data: {
                summary: {
                    totalVideos,
                    youtubeVideos,
                    instagramVideos,
                    totalHashtags,
                    repostEligible,
                    reposted
                },
                topPerformers: {
                    youtube: topYouTube,
                    instagram: topInstagram
                },
                averagePerformance: avgPerformance
            }
        });
    }
    catch (error) {
        console.error('Error fetching insights analytics:', error);
        res.status(500).json({
            error: 'Failed to fetch insights analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/insights/repost/check
 * Check if repost should be triggered
 */
router.post('/repost/check', async (req, res) => {
    try {
        const repostService = new smartRepost_1.SmartRepostService();
        const shouldTrigger = await repostService.shouldTriggerRepost();
        if (shouldTrigger) {
            const candidates = await repostService.getRepostCandidates(3);
            res.json({
                success: true,
                data: {
                    shouldTrigger: true,
                    candidatesFound: candidates.length,
                    candidates: candidates.map(c => ({
                        videoId: c.videoId,
                        platform: c.platform,
                        performanceScore: c.performanceScore,
                        title: c.title,
                        views: c.views,
                        likes: c.likes
                    }))
                }
            });
        }
        else {
            res.json({
                success: true,
                data: {
                    shouldTrigger: false,
                    message: 'Repost threshold not met'
                }
            });
        }
    }
    catch (error) {
        console.error('Error checking repost trigger:', error);
        res.status(500).json({
            error: 'Failed to check repost trigger',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/insights/repost/trigger
 * Manually trigger smart repost process
 */
router.post('/repost/trigger', async (req, res) => {
    try {
        const repostService = new smartRepost_1.SmartRepostService();
        const result = await repostService.performSmartRepost();
        res.json({
            success: true,
            message: 'Smart repost process completed',
            data: result
        });
    }
    catch (error) {
        console.error('Error triggering smart repost:', error);
        res.status(500).json({
            error: 'Failed to trigger smart repost',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * DELETE /api/insights/clear
 * Clear all insights data (for testing)
 */
router.delete('/clear', async (req, res) => {
    try {
        const { confirm } = req.body;
        if (confirm !== 'CLEAR_ALL_INSIGHTS') {
            return res.status(400).json({
                error: 'Confirmation required. Send { "confirm": "CLEAR_ALL_INSIGHTS" }'
            });
        }
        await Promise.all([
            PostInsights_1.default.deleteMany({}),
            TopHashtags_1.default.deleteMany({})
        ]);
        res.json({
            success: true,
            message: 'All insights data cleared successfully'
        });
    }
    catch (error) {
        console.error('Error clearing insights data:', error);
        res.status(500).json({
            error: 'Failed to clear insights data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/insights/phase2/run
 * Complete Phase 2 scraping process - scrape both platforms and trigger smart reposts
 */
router.post('/phase2/run', async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { credentials } = req.body;
        if (!credentials || (!credentials.youtube && !credentials.instagram)) {
            return res.status(400).json({
                error: 'Platform credentials required. Provide youtube and/or instagram credentials.'
            });
        }
        console.log('🚀 PHASE 2: Starting complete scraping and smart repost process...');
        const results = {
            scraping: {
                youtube: null,
                instagram: null,
                totalVideosScraped: 0,
                totalHashtagsUpdated: 0
            },
            smartRepost: null,
            summary: {
                success: false,
                videosAnalyzed: 0,
                repostCandidatesFound: 0,
                repostsScheduled: 0,
                topHashtags: []
            }
        };
        // Phase 2A: Scrape YouTube if credentials provided
        if (((_a = credentials.youtube) === null || _a === void 0 ? void 0 : _a.apiKey) && ((_b = credentials.youtube) === null || _b === void 0 ? void 0 : _b.channelId)) {
            try {
                console.log('📺 Phase 2A: Scraping YouTube channel...');
                const ytScraper = new youtubeScraper_1.YouTubeScraper(credentials.youtube.apiKey, credentials.youtube.channelId, credentials.youtube.refreshToken);
                results.scraping.youtube = await ytScraper.performFullScrape();
                results.scraping.totalVideosScraped += results.scraping.youtube.videosScraped;
                results.scraping.totalHashtagsUpdated += results.scraping.youtube.hashtagsUpdated;
                console.log(`✅ YouTube: ${results.scraping.youtube.videosScraped} videos, ${results.scraping.youtube.hashtagsUpdated} hashtags`);
            }
            catch (ytError) {
                console.error('❌ YouTube scraping failed:', ytError);
                results.scraping.youtube = { error: 'Failed to scrape YouTube' };
            }
        }
        // Phase 2B: Scrape Instagram if credentials provided
        if (((_c = credentials.instagram) === null || _c === void 0 ? void 0 : _c.accessToken) && ((_d = credentials.instagram) === null || _d === void 0 ? void 0 : _d.pageId)) {
            try {
                console.log('📸 Phase 2B: Scraping Instagram page...');
                const igScraper = new instagramScraper_1.InstagramScraper(credentials.instagram.accessToken, credentials.instagram.pageId);
                results.scraping.instagram = await igScraper.performFullScrape();
                results.scraping.totalVideosScraped += results.scraping.instagram.videosScraped;
                results.scraping.totalHashtagsUpdated += results.scraping.instagram.hashtagsUpdated;
                console.log(`✅ Instagram: ${results.scraping.instagram.videosScraped} videos, ${results.scraping.instagram.hashtagsUpdated} hashtags`);
            }
            catch (igError) {
                console.error('❌ Instagram scraping failed:', igError);
                results.scraping.instagram = { error: 'Failed to scrape Instagram' };
            }
        }
        // Phase 2C: Run Smart Repost Analysis
        try {
            console.log('🧠 Phase 2C: Running smart repost analysis...');
            const repostService = new smartRepost_1.SmartRepostService();
            results.smartRepost = await repostService.performSmartRepost();
            console.log(`✅ Smart Repost: ${results.smartRepost.candidatesFound} candidates, ${results.smartRepost.repostsScheduled} scheduled`);
        }
        catch (repostError) {
            console.error('❌ Smart repost failed:', repostError);
            results.smartRepost = {
                triggered: false,
                candidatesFound: 0,
                repostsScheduled: 0,
                error: 'Smart repost analysis failed'
            };
        }
        // Phase 2D: Get top hashtags for summary
        try {
            const topHashtags = await TopHashtags_1.default.find({})
                .sort({ avgViewScore: -1 })
                .limit(10)
                .select('hashtag')
                .lean();
            results.summary.topHashtags = topHashtags.map(h => h.hashtag);
        }
        catch (hashtagError) {
            console.warn('Could not fetch top hashtags for summary');
            results.summary.topHashtags = [];
        }
        // Compile final summary
        results.summary = {
            success: true,
            videosAnalyzed: results.scraping.totalVideosScraped,
            repostCandidatesFound: ((_e = results.smartRepost) === null || _e === void 0 ? void 0 : _e.candidatesFound) || 0,
            repostsScheduled: ((_f = results.smartRepost) === null || _f === void 0 ? void 0 : _f.repostsScheduled) || 0,
            topHashtags: results.summary.topHashtags
        };
        console.log('✅ PHASE 2 COMPLETE:', results.summary);
        res.json({
            success: true,
            message: 'Phase 2 complete: YouTube & Instagram scraping with smart repost analysis',
            data: results,
            phase2Status: {
                scrapingComplete: !!(results.scraping.youtube || results.scraping.instagram),
                smartRepostTriggered: ((_g = results.smartRepost) === null || _g === void 0 ? void 0 : _g.triggered) || false,
                totalVideoInsights: results.scraping.totalVideosScraped,
                readyForPhase3: results.summary.videosAnalyzed > 0
            }
        });
    }
    catch (error) {
        console.error('❌ PHASE 2 Error:', error);
        res.status(500).json({
            error: 'Phase 2 process failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            phase: 'PHASE 2 - Smart Scraping & Reposts'
        });
    }
});
/**
 * GET /api/insights/phase2/status
 * Check Phase 2 implementation status and data
 */
router.get('/phase2/status', async (req, res) => {
    try {
        const [totalInsights, youtubeInsights, instagramInsights, totalHashtags, repostEligible, alreadyReposted] = await Promise.all([
            PostInsights_1.default.countDocuments(),
            PostInsights_1.default.countDocuments({ platform: 'youtube' }),
            PostInsights_1.default.countDocuments({ platform: 'instagram' }),
            TopHashtags_1.default.countDocuments(),
            PostInsights_1.default.countDocuments({ repostEligible: true, reposted: false }),
            PostInsights_1.default.countDocuments({ reposted: true })
        ]);
        // Get recent scraping activity
        const recentInsights = await PostInsights_1.default.find({})
            .sort({ scrapedAt: -1 })
            .limit(5)
            .select('platform videoId performanceScore scrapedAt')
            .lean();
        // Get top performing videos per platform
        const [topYouTube, topInstagram] = await Promise.all([
            PostInsights_1.default.findOne({ platform: 'youtube' })
                .sort({ performanceScore: -1 })
                .select('videoId performanceScore views likes title')
                .lean(),
            PostInsights_1.default.findOne({ platform: 'instagram' })
                .sort({ performanceScore: -1 })
                .select('videoId performanceScore views likes title')
                .lean()
        ]);
        // Get top hashtags
        const topHashtags = await TopHashtags_1.default.find({})
            .sort({ avgViewScore: -1 })
            .limit(10)
            .select('hashtag avgViewScore usageCount platform')
            .lean();
        res.json({
            success: true,
            phase2Status: {
                implemented: true,
                dataCollected: totalInsights > 0,
                scrapingModels: '✅ PostInsights & TopHashtags',
                smartRepostLogic: '✅ 20 new uploads threshold',
                readyForTesting: true
            },
            data: {
                totalVideoInsights: totalInsights,
                platforms: {
                    youtube: youtubeInsights,
                    instagram: instagramInsights
                },
                hashtags: {
                    total: totalHashtags,
                    top10: topHashtags
                },
                reposts: {
                    eligible: repostEligible,
                    completed: alreadyReposted
                },
                topPerformers: {
                    youtube: topYouTube,
                    instagram: topInstagram
                },
                recentActivity: recentInsights
            },
            nextSteps: {
                testScrapingProcess: 'POST /api/insights/phase2/run',
                viewVideoInsights: 'GET /api/insights/videos',
                checkRepostTrigger: 'POST /api/insights/repost/check',
                manualRepost: 'POST /api/insights/repost/trigger'
            }
        });
    }
    catch (error) {
        console.error('Error getting Phase 2 status:', error);
        res.status(500).json({
            error: 'Failed to get Phase 2 status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
