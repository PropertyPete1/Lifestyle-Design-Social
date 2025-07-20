"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDailyPerformance = logDailyPerformance;
exports.logPostAnalytics = logPostAnalytics;
const mongoClient_1 = require("../db/mongoClient");
const captionStorage_1 = require("../db/captionStorage");
async function logDailyPerformance(postId, views, likes, comments) {
    return mongoClient_1.db.collection("daily_metrics").insertOne({
        postId,
        views,
        likes,
        comments,
        trackedAt: new Date(),
    });
}
async function logPostAnalytics(videoId, caption, views) {
    const performanceScore = views > 5000 ? 100 : views > 1000 ? 75 : 50;
    await (0, captionStorage_1.saveCaptionPerformance)(caption, performanceScore);
}
//# sourceMappingURL=postLogger.js.map