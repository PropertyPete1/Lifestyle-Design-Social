"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordViewerEngagement = recordViewerEngagement;
exports.getBestPostingHours = getBestPostingHours;
const mongoClient_1 = require("../db/mongoClient");
async function recordViewerEngagement(hour, likes, views) {
    return mongoClient_1.db.collection("viewer_engagement").updateOne({ hour }, { $inc: { likes, views, count: 1 } }, { upsert: true });
}
async function getBestPostingHours() {
    const data = await mongoClient_1.db.collection("viewer_engagement").find().sort({ views: -1 }).limit(3).toArray();
    return data.map((entry) => entry.hour);
}
//# sourceMappingURL=viewerActivity.js.map