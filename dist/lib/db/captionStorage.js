"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastInstagramCaptions = getPastInstagramCaptions;
exports.saveInstagramCaption = saveInstagramCaption;
exports.storeCaption = storeCaption;
exports.saveCaptionPerformance = saveCaptionPerformance;
exports.fetchTopCaptionsFromDB = fetchTopCaptionsFromDB;
const mongoClient_1 = require("./mongoClient");
const storedCaptions = [];
async function getPastInstagramCaptions() {
    const docs = await mongoClient_1.db.collection("captions").find().sort({ createdAt: -1 }).limit(50).toArray();
    return docs.map((d) => d.text);
}
async function saveInstagramCaption(text) {
    return mongoClient_1.db.collection("captions").insertOne({ text, createdAt: new Date() });
}
async function storeCaption(caption, engagement, hashtags) {
    return mongoClient_1.db.collection("captions").insertOne({
        caption,
        engagement,
        hashtags,
        createdAt: new Date()
    });
}
async function saveCaptionPerformance(captionText, score) {
    const collection = mongoClient_1.db.collection('captions');
    await collection.insertOne({
        captionText,
        performanceScore: score,
        timestamp: new Date(),
    });
    storedCaptions.push({ caption: captionText, score });
    storedCaptions.sort((a, b) => b.score - a.score);
    if (storedCaptions.length > 20)
        storedCaptions.pop();
}
async function fetchTopCaptionsFromDB() {
    return storedCaptions.slice(0, 3).map((c) => c.caption);
}
//# sourceMappingURL=captionStorage.js.map