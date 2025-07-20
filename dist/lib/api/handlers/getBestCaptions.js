"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestCaptions = getBestCaptions;
const mongoClient_1 = require("../../db/mongoClient");
async function getBestCaptions(limit = 3) {
    const collection = mongoClient_1.db.collection('captions');
    const bestCaptions = await collection
        .find({})
        .sort({ performanceScore: -1, timestamp: -1 })
        .limit(limit)
        .toArray();
    return bestCaptions.map((caption) => ({
        id: caption._id,
        text: caption.captionText || caption.caption || caption.text,
        score: caption.performanceScore || caption.engagement || 0,
        timestamp: caption.timestamp || caption.createdAt
    }));
}
//# sourceMappingURL=getBestCaptions.js.map