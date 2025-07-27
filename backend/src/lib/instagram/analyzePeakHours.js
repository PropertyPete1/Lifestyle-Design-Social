"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePeakHours = analyzePeakHours;
exports.getOptimalPostingTimes = getOptimalPostingTimes;
const PeakEngagementTimes_1 = __importDefault(require("../../models/PeakEngagementTimes"));
async function analyzePeakHours() {
    try {
        console.log('🕒 Starting Instagram Peak Hours Analysis...');
        // Get Instagram posts from last 60 posts
        const posts = await fetchLastInstagramPosts(60);
        if (posts.length === 0) {
            console.log('❌ No Instagram posts found for analysis');
            return;
        }
        console.log(`📊 Analyzing ${posts.length} Instagram posts for peak hours...`);
        // Calculate engagement metrics for each post
        const metrics = posts.map(post => calculateEngagementMetrics(post));
        // Group by day of week and hour
        const groupedMetrics = groupMetricsByTimeSlot(metrics);
        // Calculate average scores and update database
        await updatePeakEngagementTimes(groupedMetrics, 'instagram');
        console.log('✅ Instagram Peak Hours Analysis completed successfully');
    }
    catch (error) {
        console.error('❌ Error analyzing Instagram peak hours:', error);
        throw error;
    }
}
async function fetchLastInstagramPosts(count) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;
        if (!accessToken || !pageId) {
            throw new Error('Instagram access token or page ID not found');
        }
        // Get Instagram account ID from Facebook Page
        const pageResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
        if (!pageResponse.ok) {
            throw new Error(`Failed to get Instagram account: ${pageResponse.statusText}`);
        }
        const pageData = await pageResponse.json();
        const instagramAccountId = (_a = pageData.instagram_business_account) === null || _a === void 0 ? void 0 : _a.id;
        if (!instagramAccountId) {
            throw new Error('Instagram business account not found');
        }
        // Get recent media posts
        const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramAccountId}/media?fields=id,timestamp,media_type,caption&limit=${count}&access_token=${accessToken}`);
        if (!mediaResponse.ok) {
            throw new Error(`Failed to get Instagram media: ${mediaResponse.statusText}`);
        }
        const mediaData = await mediaResponse.json();
        const posts = [];
        // Get insights for each post
        for (const media of mediaData.data || []) {
            try {
                const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${media.id}/insights?metric=impressions,reach,likes,comments&access_token=${accessToken}`);
                if (insightsResponse.ok) {
                    const insightsData = await insightsResponse.json();
                    const insights = insightsData.data || [];
                    const impressions = ((_c = (_b = insights.find((i) => i.name === 'impressions')) === null || _b === void 0 ? void 0 : _b.values[0]) === null || _c === void 0 ? void 0 : _c.value) || 0;
                    const reach = ((_e = (_d = insights.find((i) => i.name === 'reach')) === null || _d === void 0 ? void 0 : _d.values[0]) === null || _e === void 0 ? void 0 : _e.value) || 0;
                    const likes = ((_g = (_f = insights.find((i) => i.name === 'likes')) === null || _f === void 0 ? void 0 : _f.values[0]) === null || _g === void 0 ? void 0 : _g.value) || 0;
                    const comments = ((_j = (_h = insights.find((i) => i.name === 'comments')) === null || _h === void 0 ? void 0 : _h.values[0]) === null || _j === void 0 ? void 0 : _j.value) || 0;
                    posts.push({
                        id: media.id,
                        timestamp: media.timestamp,
                        media_type: media.media_type,
                        like_count: likes,
                        comments_count: comments,
                        impressions,
                        reach,
                        caption: media.caption || ''
                    });
                }
            }
            catch (error) {
                console.warn(`Failed to get insights for post ${media.id}:`, error);
                // Add post without insights
                posts.push({
                    id: media.id,
                    timestamp: media.timestamp,
                    media_type: media.media_type,
                    like_count: 0,
                    comments_count: 0,
                    impressions: 0,
                    reach: 0,
                    caption: media.caption || ''
                });
            }
            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return posts;
    }
    catch (error) {
        console.error('❌ Error fetching Instagram posts:', error);
        return [];
    }
}
function calculateEngagementMetrics(post) {
    const postTime = new Date(post.timestamp);
    const hour = postTime.getHours();
    const dayOfWeek = postTime.toLocaleDateString('en-US', { weekday: 'long' });
    // Calculate engagement metrics
    const viewsAfter60Min = Math.max(post.impressions, post.reach); // Use impressions as proxy for views
    const likesToViewsRatio = viewsAfter60Min > 0 ? (post.like_count / viewsAfter60Min) * 100 : 0;
    const commentsPerHour = post.comments_count; // Approximation - would need hourly breakdown
    // Calculate composite engagement score (0-100)
    const engagementScore = Math.min(100, ((likesToViewsRatio * 35) + // 35% weight on like ratio
        (Math.min(post.comments_count / 5, 25)) + // 25% weight on comments (capped)
        (Math.min(viewsAfter60Min / 500, 25)) + // 25% weight on views (normalized)
        (Math.min(post.reach / 300, 15)) // 15% weight on reach (normalized)
    ));
    return {
        postTime,
        hour,
        dayOfWeek,
        viewsAfter60Min,
        likesToViewsRatio,
        commentsPerHour,
        engagementScore
    };
}
function groupMetricsByTimeSlot(metrics) {
    const grouped = new Map();
    metrics.forEach(metric => {
        const key = `${metric.dayOfWeek}-${metric.hour}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(metric);
    });
    return grouped;
}
async function updatePeakEngagementTimes(groupedMetrics, platform) {
    const updates = [];
    for (const [key, metrics] of groupedMetrics) {
        const [dayOfWeek, hourStr] = key.split('-');
        const hour = parseInt(hourStr);
        const avgScore = metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length;
        const totalPosts = metrics.length;
        updates.push({
            updateOne: {
                filter: { platform, dayOfWeek, hour },
                update: {
                    $set: {
                        avgScore: Math.round(avgScore * 100) / 100, // Round to 2 decimal places
                        totalPosts,
                        lastUpdated: new Date()
                    }
                },
                upsert: true
            }
        });
    }
    if (updates.length > 0) {
        await PeakEngagementTimes_1.default.bulkWrite(updates);
        console.log(`📊 Updated ${updates.length} peak engagement time slots for ${platform}`);
    }
}
async function getOptimalPostingTimes(platform, limit = 5) {
    try {
        const peakTimes = await PeakEngagementTimes_1.default
            .find({ platform })
            .sort({ avgScore: -1 })
            .limit(limit)
            .lean();
        return peakTimes.map(time => ({
            dayOfWeek: time.dayOfWeek,
            hour: time.hour,
            score: time.avgScore,
            totalPosts: time.totalPosts,
            timeSlot: `${time.dayOfWeek} ${formatHour(time.hour)}`
        }));
    }
    catch (error) {
        console.error(`❌ Error getting optimal posting times for ${platform}:`, error);
        return [];
    }
}
function formatHour(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
}
