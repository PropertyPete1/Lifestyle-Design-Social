"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToQueue = addToQueue;
exports.getNextUnposted = getNextUnposted;
exports.markPosted = markPosted;
exports.getTodayScheduledVideos = getTodayScheduledVideos;
const mongoClient_1 = require("../db/mongoClient");
const mongodb_1 = require("mongodb");
const dummyQueue = [
    {
        id: 'vid001',
        caption: '🏡 Check out this cozy 3-bed home!',
        fileUrl: 'https://your-cdn/video1.mp4',
        scheduledDate: new Date().toISOString().split('T')[0],
    },
];
async function addToQueue(url, type) {
    return mongoClient_1.db.collection("video_queue").insertOne({
        url,
        type,
        posted: false,
        uploadedAt: new Date(),
    });
}
async function getNextUnposted(type) {
    return mongoClient_1.db.collection("video_queue").findOne({ type, posted: false });
}
async function markPosted(videoId) {
    return mongoClient_1.db.collection("video_queue").updateOne({ _id: new mongodb_1.ObjectId(videoId) }, { $set: { posted: true } });
}
async function getTodayScheduledVideos() {
    const today = new Date().toISOString().split('T')[0];
    return dummyQueue.filter((v) => v.scheduledDate === today);
}
//# sourceMappingURL=videoQueue.js.map