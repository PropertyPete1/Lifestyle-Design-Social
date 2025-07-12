"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 5001;
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
const authMiddleware = (req, res, next) => {
    const token = req.headers['x-auth-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    req.userId = 'user-123';
    next();
};
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Real Estate Auto-Posting API - Simplified',
        version: '1.0.0',
        status: 'running',
    });
});
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'fake-jwt-token',
        user: { id: 'user-123', email: req.body.email, name: 'Test User' }
    });
});
app.post('/api/auth/register', (req, res) => {
    res.json({
        success: true,
        token: 'fake-jwt-token',
        user: { id: 'user-123', email: req.body.email, name: req.body.name }
    });
});
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User'
    });
});
app.get('/api/analytics/overview', authMiddleware, (req, res) => {
    res.json({
        totalVideos: 12,
        scheduledPosts: 8,
        publishedPosts: 15,
        totalViews: 2450,
        totalLikes: 180,
        totalComments: 45,
        totalShares: 28,
    });
});
app.get('/api/analytics', authMiddleware, (req, res) => {
    const timeRange = req.query.timeRange || '30d';
    const platform = req.query.platform || 'all';
    res.json({
        overview: {
            totalVideos: 12,
            scheduledPosts: 8,
            publishedPosts: 15,
            totalViews: 2450,
            totalLikes: 180,
            totalComments: 45,
            totalShares: 28,
        },
        platformPerformance: [
            { platform: 'Instagram', posts: 8, views: 1200, engagement: 0.15 },
            { platform: 'TikTok', posts: 5, views: 800, engagement: 0.22 },
            { platform: 'YouTube', posts: 2, views: 450, engagement: 0.18 }
        ],
        engagementTrends: [
            { date: '2024-01-01', views: 120, likes: 15, comments: 3 },
            { date: '2024-01-02', views: 150, likes: 18, comments: 5 },
            { date: '2024-01-03', views: 180, likes: 22, comments: 7 }
        ],
        timeRange,
        platform
    });
});
app.get('/api/posts', authMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const samplePosts = [
        {
            id: 1,
            title: 'Beautiful Downtown Condo',
            platform: 'Instagram',
            status: 'published',
            scheduledAt: new Date().toISOString(),
            views: 850,
            likes: 42,
            comments: 8,
            caption: 'Amazing downtown views! #realestate #condo',
            thumbnail: '/api/placeholder-thumbnail.jpg'
        },
        {
            id: 2,
            title: 'Luxury Home Tour Video',
            platform: 'TikTok',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            views: 0,
            likes: 0,
            comments: 0,
            caption: 'Take a tour of this stunning luxury home! #luxury #realestate',
            thumbnail: '/api/placeholder-thumbnail.jpg'
        },
        {
            id: 3,
            title: 'Real Estate Market Update',
            platform: 'Instagram',
            status: 'published',
            scheduledAt: new Date(Date.now() - 172800000).toISOString(),
            views: 1200,
            likes: 68,
            comments: 15,
            caption: 'Latest market trends and insights #realestatemarket #trends',
            thumbnail: '/api/placeholder-thumbnail.jpg'
        }
    ];
    res.json(samplePosts.slice(0, limit));
});
app.get('/api/platforms/status', (req, res) => {
    res.json({
        instagram: { connected: false, lastPost: null },
        tiktok: { connected: false, lastPost: null },
        youtube: { connected: false, lastPost: null }
    });
});
app.get('/api/settings', authMiddleware, (req, res) => {
    res.json({
        postingSchedule: {
            enabled: true,
            postsPerDay: 3,
            preferredTimes: ['09:00', '14:00', '19:00'],
            timezone: 'America/Chicago',
        },
        platforms: {
            instagram: { connected: false, username: '' },
            tiktok: { connected: false, username: '' },
            youtube: { connected: false, username: '' },
        },
        notifications: {
            email: true,
            push: true,
            postSuccess: true,
            postFailure: true,
            lowContent: true,
        },
        content: {
            autoGenerateCaptions: true,
            useTrendingHashtags: true,
            includeLocation: true,
            watermark: false,
        },
    });
});
app.get('/api/autopost/status', authMiddleware, (req, res) => {
    res.json({
        enabled: false,
        cameraRollPath: process.env.CAMERA_ROLL_PATH || '/Users/peterallen/Pictures',
        postingTimes: ['09:00', '12:00', '18:00'],
        nextPostTime: 'Auto-posting disabled'
    });
});
app.post('/api/autopost/enable', authMiddleware, (req, res) => {
    res.json({
        message: 'Auto-posting enabled successfully',
        settings: {
            enabled: true,
            cameraRollPath: req.body.cameraRollPath || '/Users/peterallen/Pictures',
            postingTimes: req.body.postingTimes || ['09:00', '12:00', '18:00']
        }
    });
});
app.post('/api/autopost/disable', authMiddleware, (req, res) => {
    res.json({
        message: 'Auto-posting disabled successfully',
        settings: { enabled: false }
    });
});
app.post('/api/autopost/scan-camera-roll', authMiddleware, (req, res) => {
    const targetCount = req.body.targetCount || 3;
    res.json({
        message: `Successfully selected ${targetCount} videos for auto-posting`,
        videos: Array.from({ length: targetCount }, (_, i) => ({
            name: `video_${i + 1}.mp4`,
            duration: 30 + i * 10,
            size: (15 + i * 5) * 1024 * 1024,
            resolution: `1920x1080`,
            aiScore: 0.85 + i * 0.05,
            hasAudio: true
        }))
    });
});
app.post('/api/autopost/test-scan', authMiddleware, (req, res) => {
    const totalVideos = 12;
    const selectedVideos = 5;
    res.json({
        message: `Found ${totalVideos} total videos, ${selectedVideos} selected for posting`,
        totalVideos,
        selectedVideos: Array.from({ length: selectedVideos }, (_, i) => ({
            name: `selected_video_${i + 1}.mp4`,
            duration: 25 + i * 15,
            size: `${(12 + i * 3).toFixed(2)} MB`,
            resolution: `1920x1080`,
            aiScore: 0.82 + i * 0.03,
            hasAudio: true
        }))
    });
});
app.get('/api/autopost/next-video', authMiddleware, (req, res) => {
    res.json({
        video: {
            id: 'stub-video-1',
            title: 'Sample Real Estate Video',
            description: 'A beautiful home tour.',
            duration: 60,
            postCount: 2,
            lastPosted: new Date().toISOString(),
            fileName: 'video1.mp4'
        }
    });
});
app.get('/api/autopost/video-stats', authMiddleware, (req, res) => {
    res.json({
        stats: {
            totalVideos: 2,
            totalPosts: 5,
            avgPostsPerVideo: 2.5,
            unpostedVideos: 1,
            readyToRepost: 1
        }
    });
});
app.post('/api/autopost/create-cartoon', authMiddleware, (req, res) => {
    res.json({
        message: 'Cartoon created successfully',
        cartoon: {
            id: 'cartoon-' + Date.now(),
            title: 'Funny Real Estate Cartoon #' + Math.floor(Math.random() * 100),
            duration: 15,
            fileName: `cartoon_${Date.now()}.mp4`,
            url: `/api/autopost/cartoons/download/cartoon_${Date.now()}.mp4`
        }
    });
});
app.get('/api/autopost/cartoon-stats', authMiddleware, (req, res) => {
    res.json({
        totalCartoons: 5,
        recentCartoons: [
            { title: 'Cartoon 1', created: new Date().toISOString() },
            { title: 'Cartoon 2', created: new Date(Date.now() - 86400000).toISOString() }
        ],
        message: 'Created 5 cartoons total'
    });
});
app.get('/api/autopost/cartoons', authMiddleware, (req, res) => {
    res.json({
        cartoons: [
            { fileName: 'sample.mp4', url: '/api/autopost/cartoons/download/sample.mp4' }
        ]
    });
});
app.post('/api/autopost/mark-video-posted', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Video marked as posted successfully'
    });
});
app.post('/api/autopost/set-camera-roll-path', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Camera roll path updated successfully',
        path: req.body.cameraRollPath
    });
});
app.post('/api/autopost/manual-post', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Manual post completed successfully',
        post: {
            id: 'manual-post-' + Date.now(),
            platform: 'instagram',
            status: 'posted'
        }
    });
});
app.get('/api/autopost/cartoons/download/:fileName', (req, res) => {
    res.json({
        success: true,
        message: 'Cartoon download initiated',
        downloadUrl: `https://sample-videos.com/zip/10/mp4/480/${req.params.fileName}`,
        note: 'This is a demo response - in production this would be an actual video file'
    });
});
app.get('/api/autopost/instagram-status', authMiddleware, (req, res) => {
    res.json({
        connected: false,
        setupInstructions: {
            step1: 'Connect your Instagram account to a Facebook Page',
            step2: 'Convert your Instagram account to a Business/Creator account',
            step3: 'Ensure your Facebook Page has the Instagram account connected',
            step4: 'The system will automatically detect the connection'
        },
        note: 'Instagram posting is optional - videos and cartoons will still be created and saved for manual posting'
    });
});
app.get('/api/videos', authMiddleware, (req, res) => {
    res.json({
        videos: [
            {
                id: 'video-1',
                title: 'Home Tour Video',
                duration: 45,
                status: 'ready',
                postCount: 2,
                fileName: 'home_tour.mp4'
            },
            {
                id: 'video-2',
                title: 'Property Showcase',
                duration: 32,
                status: 'new',
                postCount: 0,
                fileName: 'property.mp4'
            }
        ]
    });
});
app.get('/api/videos/:id/stream', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Video streaming initiated',
        streamUrl: `https://sample-videos.com/zip/10/mp4/480/sample-${req.params.id}.mp4`,
        note: 'This is a demo response - in production this would stream actual video data'
    });
});
app.put('/api/videos/:id', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Video updated successfully',
        video: {
            id: req.params.id,
            description: req.body.description,
            title: req.body.title
        }
    });
});
app.post('/api/videos/upload', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Video uploaded successfully',
        video: {
            id: 'video-' + Date.now(),
            title: 'New Upload',
            duration: 30,
            status: 'new',
            postCount: 0,
            fileName: 'uploaded_video.mp4'
        }
    });
});
app.put('/api/videos/:id/caption', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Caption updated successfully',
        video: {
            id: req.params.id,
            caption: req.body.caption
        }
    });
});
app.delete('/api/videos/:id', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Video deleted successfully'
    });
});
app.post('/api/oauth/instagram/authorize', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Instagram authorization initiated',
        authUrl: 'https://api.instagram.com/oauth/authorize?client_id=demo&response_type=code&redirect_uri=http://localhost:3000/callback'
    });
});
app.post('/api/oauth/tiktok/authorize', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'TikTok authorization initiated',
        authUrl: 'https://www.tiktok.com/auth/authorize/?client_key=demo&response_type=code&redirect_uri=http://localhost:3000/callback'
    });
});
app.post('/api/oauth/youtube/authorize', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'YouTube authorization initiated',
        authUrl: 'https://accounts.google.com/oauth/authorize?client_id=demo&response_type=code&redirect_uri=http://localhost:3000/callback'
    });
});
app.delete('/api/oauth/instagram/disconnect', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Instagram disconnected successfully'
    });
});
app.delete('/api/oauth/tiktok/disconnect', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'TikTok disconnected successfully'
    });
});
app.delete('/api/oauth/youtube/disconnect', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'YouTube disconnected successfully'
    });
});
app.put('/api/settings', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: req.body
    });
});
app.post('/api/settings/api-keys', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'API key saved successfully',
        key: {
            name: req.body.name,
            masked: req.body.key?.substring(0, 8) + '***'
        }
    });
});
app.get('/api/settings/api-keys', authMiddleware, (req, res) => {
    res.json({
        keys: [
            { name: 'OpenAI', masked: 'sk-proj***', configured: true },
            { name: 'Instagram', masked: 'IGQVJ***', configured: false },
            { name: 'TikTok', masked: '', configured: false }
        ]
    });
});
app.post('/api/posts/schedule', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Post scheduled successfully',
        post: {
            id: 'post-' + Date.now(),
            platform: req.body.platform || 'instagram',
            scheduledTime: req.body.scheduledTime || new Date().toISOString(),
            status: 'scheduled'
        }
    });
});
app.post('/api/posts/bulk-action', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: `Bulk ${req.body.action} completed for ${req.body.postIds?.length || 0} posts`
    });
});
app.post('/api/posts/:id/publish', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Post published successfully'
    });
});
app.post('/api/posts/:id/cancel', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Post cancelled successfully'
    });
});
app.post('/api/posts/:id/retry', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Post retry initiated'
    });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.post('/api/instagram-learning/sync', authMiddleware, (req, res) => {
    const { postsToFetch = 50 } = req.body;
    setTimeout(() => {
        res.json({
            success: true,
            message: `Successfully synced ${postsToFetch} Instagram posts and analyzed your content style`,
            data: {
                postsFetched: postsToFetch,
                postsAnalyzed: postsToFetch,
                stylesIdentified: 5,
                topPerformingThemes: ['property tours', 'market updates', 'client testimonials'],
                dominantTone: 'professional',
                averageEngagement: 8.7,
                nextStep: 'Your personal style has been analyzed. You can now generate personalized captions!'
            }
        });
    }, 2000);
});
app.get('/api/instagram-learning/style-analysis', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: {
            style: {
                dominantTone: 'professional',
                averageWordCount: 145,
                commonPhrases: [
                    'Dream home alert!',
                    'What do you think?',
                    'Swipe to see more',
                    'Would you live here?',
                    'Tag someone who needs to see this'
                ],
                preferredHashtags: [
                    '#realestate', '#dreamhome', '#luxury', '#propertyinvestment',
                    '#newhome', '#forsale', '#realtor', '#homesweethome'
                ],
                topPerformingThemes: ['luxury homes', 'investment opportunities', 'market insights'],
                writingPatterns: [
                    {
                        pattern: 'Question + Answer format',
                        frequency: 15,
                        avgPerformance: 8.5,
                        examples: ['What makes this home special? The panoramic views!']
                    },
                    {
                        pattern: 'Call-to-action ending',
                        frequency: 12,
                        avgPerformance: 7.8,
                        examples: ['DM me for a private showing!']
                    }
                ],
                engagementTriggers: ['Questions', 'Call-to-Action', 'Emojis', 'Location tags'],
                lastAnalyzed: new Date().toISOString(),
                totalPosts: 48,
                averagePerformance: 7.9
            },
            insights: {
                totalPostsAnalyzed: 48,
                averagePerformance: 7.9,
                bestPerformingContent: ['luxury homes', 'investment opportunities', 'market insights'],
                writingStrengths: ['Questions', 'Call-to-Action', 'Emojis', 'Location tags'],
                recommendations: [
                    'Use more questions to increase engagement',
                    'Include location tags for better reach',
                    'Your luxury content performs 40% better than average'
                ]
            }
        },
        message: 'Your personal Instagram style has been analyzed successfully'
    });
});
app.get('/api/instagram-learning/posts-performance', authMiddleware, (req, res) => {
    const { limit = 20, sortBy = 'performance' } = req.query;
    const posts = Array.from({ length: Math.min(20, parseInt(limit)) }, (_, i) => ({
        id: `post_${i + 1}`,
        caption: `Amazing ${['luxury home', 'investment opportunity', 'market update', 'client testimonial'][i % 4] || 'content'} content`,
        performanceScore: Math.random() * 4 + 6,
        engagementRate: Math.random() * 5 + 3,
        likes: Math.floor(Math.random() * 500 + 100),
        comments: Math.floor(Math.random() * 50 + 10),
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        hashtags: ['#realestate', '#dreamhome', '#luxury'],
        contentType: ['property_tour', 'market_update', 'tips_advice', 'testimonial'][i % 4] || 'property_tour'
    }));
    res.json({
        success: true,
        data: {
            posts: posts.sort((a, b) => {
                if (!a || !b)
                    return 0;
                if (sortBy === 'performance') {
                    return (b.performanceScore || 0) - (a.performanceScore || 0);
                }
                else if (sortBy === 'engagement') {
                    return (b.engagementRate || 0) - (a.engagementRate || 0);
                }
                else {
                    return new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime();
                }
            }),
            summary: {
                averagePerformance: 7.9,
                averageEngagement: 5.2,
                topPerformer: posts[0] || null,
                improvementAreas: ['Add more call-to-actions', 'Use trending hashtags']
            }
        },
        message: 'Posts performance data retrieved successfully'
    });
});
app.post('/api/instagram-learning/generate-caption', authMiddleware, (req, res) => {
    const { contentDescription, targetTone = 'professional', includeHashtags = true, captionCount = 5 } = req.body;
    const captions = [
        {
            text: `🏡 Just listed this incredible ${contentDescription}! The attention to detail in every room is absolutely stunning. From the gourmet kitchen to the spa-like master suite, this home has it all. What's your favorite feature? Drop a comment below! 👇`,
            styleMatch: 92,
            expectedPerformance: 8.5,
            reasoning: 'Matches your successful question + engagement pattern with emotional triggers',
            basedOnPosts: ['post_15', 'post_23', 'post_41']
        },
        {
            text: `Dream home alert! 🚨 This ${contentDescription} just hit the market and it's everything you've been searching for. Swipe to see why this property is getting so much attention. Would you live here? Tag someone who needs to see this! ✨`,
            styleMatch: 88,
            expectedPerformance: 8.2,
            reasoning: 'Uses your proven "Dream home alert" opener with interactive elements',
            basedOnPosts: ['post_8', 'post_19', 'post_34']
        },
        {
            text: `Investment opportunity of the week! 💰 This ${contentDescription} offers incredible potential for the right buyer. The numbers make sense and the location is prime. DM me for the full investment analysis. Who's ready to build wealth through real estate? 📈`,
            styleMatch: 85,
            expectedPerformance: 7.8,
            reasoning: 'Aligns with your investment-focused content that performs well',
            basedOnPosts: ['post_12', 'post_27', 'post_38']
        },
        {
            text: `Can we talk about this ${contentDescription}? 😍 Every single detail has been thoughtfully designed. The natural light, the flow, the finishes - it all comes together perfectly. Save this post if you love it as much as I do! What catches your eye first?`,
            styleMatch: 90,
            expectedPerformance: 8.3,
            reasoning: 'Uses your conversational tone with emotional appeal and engagement hook',
            basedOnPosts: ['post_5', 'post_21', 'post_36']
        },
        {
            text: `New listing just dropped! 📍 This ${contentDescription} is what home ownership dreams are made of. Perfect for families looking for space, style, and that special something. Ready to schedule a showing? Comment "YES" and I'll send you the details! 🗝️`,
            styleMatch: 87,
            expectedPerformance: 8.0,
            reasoning: 'Incorporates your successful call-to-action format with clear next steps',
            basedOnPosts: ['post_3', 'post_17', 'post_29']
        }
    ];
    const hashtags = includeHashtags ? [
        '#realestate', '#dreamhome', '#luxury', '#newlisting', '#propertyinvestment',
        '#realtor', '#homesweethome', '#investment', '#forsale', '#realtorlife',
        '#luxuryrealestate', '#newhome', '#propertyexpert', '#realestateagent',
        '#homeforsale', '#luxuryhomes', '#propertymarket', '#realestateinvestor',
        '#dreamhomes', '#luxuryliving'
    ] : [];
    res.json({
        success: true,
        data: {
            captions: captions.slice(0, captionCount),
            hashtags,
            styleInsights: {
                matchesYourStyle: captions[0]?.styleMatch || 0,
                expectedPerformance: captions[0]?.expectedPerformance || 0,
                basedOnTopPosts: captions[0]?.basedOnPosts?.length || 0
            }
        },
        message: 'Personalized captions generated successfully based on your Instagram style'
    });
});
app.post('/api/instagram-learning/predict-performance', authMiddleware, (req, res) => {
    const { caption, hashtags = [] } = req.body;
    const wordCount = caption.split(' ').length;
    const hasQuestion = caption.includes('?');
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(caption);
    const hasCTA = /\b(dm|comment|tag|share|save|swipe)\b/i.test(caption);
    let score = 5;
    const factors = [];
    if (hasQuestion) {
        score += 1.5;
        factors.push('includes engaging question');
    }
    if (hasEmoji) {
        score += 1;
        factors.push('uses emojis effectively');
    }
    if (hasCTA) {
        score += 1.5;
        factors.push('has clear call-to-action');
    }
    if (wordCount >= 100 && wordCount <= 200) {
        score += 1;
        factors.push('optimal length');
    }
    if (hashtags.length >= 15 && hashtags.length <= 25) {
        score += 0.5;
        factors.push('good hashtag count');
    }
    score = Math.min(10, score);
    const hashtagAnalysis = hashtags.length > 0 ? {
        averageReach: hashtags.length * 1250,
        competitiveness: 'medium',
        overusedTags: hashtags.filter(() => Math.random() < 0.1),
        recommendedAlternatives: ['#dreamhomes', '#luxuryliving', '#propertyexpert']
    } : null;
    res.json({
        success: true,
        data: {
            prediction: {
                score: Math.round(score * 10) / 10,
                confidence: 0.87,
                factors
            },
            hashtagAnalysis,
            recommendations: score < 6 ? [
                'Consider adding more emotional triggers',
                'Include a clear call-to-action',
                'Match your successful post patterns more closely'
            ] : [
                'Great caption! This matches your successful style',
                'Consider posting at your optimal times for best results'
            ]
        },
        message: 'Performance prediction completed successfully'
    });
});
app.get('/api/instagram-learning/hashtag-analysis', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: {
            topPerforming: [
                { hashtag: '#realestate', usage: 42, avgEngagement: 8.5, lastUsed: '2024-01-10' },
                { hashtag: '#dreamhome', usage: 38, avgEngagement: 8.2, lastUsed: '2024-01-11' },
                { hashtag: '#luxury', usage: 35, avgEngagement: 8.0, lastUsed: '2024-01-09' },
                { hashtag: '#propertyinvestment', usage: 28, avgEngagement: 7.8, lastUsed: '2024-01-08' },
                { hashtag: '#newlisting', usage: 25, avgEngagement: 7.5, lastUsed: '2024-01-12' }
            ],
            underperforming: [
                { hashtag: '#house', usage: 15, avgEngagement: 4.2, lastUsed: '2024-01-05' },
                { hashtag: '#property', usage: 12, avgEngagement: 4.0, lastUsed: '2024-01-04' }
            ],
            overused: ['#realestate', '#dreamhome'],
            recommendations: [
                'Try using #luxuryhomes instead of #luxury sometimes',
                'Add more niche hashtags like #propertyexpert',
                'Rotate your high-performing tags to avoid overuse'
            ],
            insights: {
                totalHashtagsUsed: 156,
                averagePerformance: 6.8,
                bestStrategy: 'Mix of popular and niche hashtags performs best for you'
            }
        },
        message: 'Hashtag performance analysis retrieved successfully'
    });
});
app.post('/api/instagram-learning/optimize-hashtags', authMiddleware, (req, res) => {
    const { contentDescription, targetReach = 'medium', avoidOverused = true } = req.body;
    const hashtagCategories = {
        personalBest: ['#realestate', '#dreamhome', '#luxury', '#propertyinvestment'],
        trending: ['#luxuryhomes', '#propertyexpert', '#realestatelife', '#homeinspiration'],
        contentSpecific: ['#newlisting', '#forsale', '#investment', '#luxuryliving'],
        niche: ['#realestateagent', '#propertymarket', '#realestateinvestor', '#luxuryrealestate']
    };
    const optimizedHashtags = [
        ...hashtagCategories.personalBest.slice(0, 6),
        ...hashtagCategories.trending.slice(0, 5),
        ...hashtagCategories.contentSpecific.slice(0, 5),
        ...hashtagCategories.niche.slice(0, 4)
    ];
    const breakdown = {
        personalBest: hashtagCategories.personalBest.slice(0, 6),
        trending: hashtagCategories.trending.slice(0, 5),
        contentSpecific: hashtagCategories.contentSpecific.slice(0, 5),
        niche: hashtagCategories.niche.slice(0, 4),
        expectedTotalReach: optimizedHashtags.length * 1200
    };
    res.json({
        success: true,
        data: {
            hashtags: optimizedHashtags,
            breakdown,
            strategy: {
                personalBest: breakdown.personalBest.length,
                trending: breakdown.trending.length,
                contentSpecific: breakdown.contentSpecific.length,
                niche: breakdown.niche.length
            },
            expectedReach: breakdown.expectedTotalReach
        },
        message: 'Optimized hashtags generated based on your performance data'
    });
});
app.post('/api/instagram-learning/submit-for-approval', authMiddleware, (req, res) => {
    const { caption, hashtags, scheduledTime, videoId, platform } = req.body;
    const approvalId = `approval_${Date.now()}`;
    res.json({
        success: true,
        data: {
            approvalId,
            prediction: {
                score: 8.2,
                confidence: 0.89,
                factors: ['matches your style', 'optimal timing', 'engaging content']
            },
            status: 'pending_approval',
            estimatedReview: '5-10 minutes',
            canEditUntil: new Date(Date.now() + 30 * 60 * 1000)
        },
        message: 'Content submitted for approval successfully. You will be notified when reviewed.'
    });
});
app.get('/api/instagram-learning/pending-approvals', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'approval_123',
                caption: 'Amazing luxury home just listed...',
                platform: 'instagram',
                scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
                prediction: { score: 8.2, confidence: 0.89 },
                status: 'pending',
                createdAt: new Date()
            }
        ],
        message: 'Pending approvals retrieved successfully'
    });
});
app.post('/api/instagram-learning/approve/:approvalId', authMiddleware, (req, res) => {
    const { approvalId } = req.params;
    const { approved, feedback } = req.body;
    res.json({
        success: true,
        data: {
            approvalId,
            status: approved ? 'approved' : 'rejected',
            nextAction: approved ? 'Content will be posted at scheduled time' : 'Content has been cancelled'
        },
        message: `Content ${approved ? 'approved' : 'rejected'} successfully`
    });
});
app.get('/api/instagram-learning/insights-report', authMiddleware, (req, res) => {
    const { timeframe = '30d' } = req.query;
    res.json({
        success: true,
        data: {
            summary: {
                totalPosts: 48,
                averagePerformance: 7.9,
                improvementSinceLastMonth: 15.2,
                topPerformingCategory: 'luxury homes'
            },
            styleEvolution: {
                consistencyScore: 87,
                improving: ['engagement rate', 'caption quality'],
                declining: [],
                recommendations: [
                    'Your style is becoming more engaging',
                    'Continue using questions in captions',
                    'Luxury content performs 40% above average'
                ]
            },
            contentInsights: {
                bestPostingTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
                topHashtags: ['#realestate', '#dreamhome', '#luxury'],
                engagementDrivers: ['Questions', 'Call-to-actions', 'Emojis'],
                contentMix: {
                    propertyTours: 45,
                    marketUpdates: 25,
                    tips: 20,
                    testimonials: 10
                }
            },
            predictions: {
                nextMonthGrowth: 12.5,
                optimalPostingFrequency: 4,
                recommendedContentTypes: ['luxury tours', 'investment tips', 'market insights']
            }
        },
        message: 'Learning insights report generated successfully'
    });
});
app.post('/api/instagram-learning/update-style', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: {
            dominantTone: 'professional',
            averageWordCount: 148,
            commonPhrases: [
                'Dream home alert!',
                'What do you think?',
                'Swipe to see more',
                'Would you live here?',
                'Tag someone who needs to see this'
            ],
            updatedAt: new Date(),
            changes: [
                'Detected increased use of emotional triggers',
                'More consistent call-to-action usage',
                'Improved readability scores'
            ]
        },
        message: 'Style analysis updated successfully with latest content'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 Simple TypeScript backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🧠 Instagram Learning AI: http://localhost:${PORT}/api/instagram-learning/style-analysis`);
});
exports.default = app;
//# sourceMappingURL=simple-server.js.map