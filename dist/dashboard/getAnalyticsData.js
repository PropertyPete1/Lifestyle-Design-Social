"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsData = getAnalyticsData;
const mongoClient_1 = require("../lib/db/mongoClient");
async function getAnalyticsData() {
    const videos = await mongoClient_1.db.collection("video_queue").find({}).sort({ createdAt: -1 }).toArray();
    const totalPosts = videos.length;
    const successfulPosts = videos.filter((v) => v.status === 'success').length;
    const failedPosts = totalPosts - successfulPosts;
    const viewsOverTime = videos.map((v) => ({
        date: v.createdAt || v.uploadedAt,
        views: v.views || 0,
    }));
    const hashtagStats = {};
    videos.forEach((video) => {
        video.hashtags?.forEach((tag) => {
            if (!hashtagStats[tag])
                hashtagStats[tag] = 0;
            hashtagStats[tag] += video.views || 0;
        });
    });
    return {
        totalPosts,
        successfulPosts,
        failedPosts,
        viewsOverTime,
        hashtagStats,
    };
}
//# sourceMappingURL=getAnalyticsData.js.map