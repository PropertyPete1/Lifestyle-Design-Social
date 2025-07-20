"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnpostedUserVideos = getUnpostedUserVideos;
exports.getCartoonVideos = getCartoonVideos;
exports.markVideoAsPosted = markVideoAsPosted;
const mongoClient_1 = require("./mongoClient");
async function getUnpostedUserVideos() {
    return mongoClient_1.db.collection("videos").find({ type: "user", posted: false }).toArray();
}
async function getCartoonVideos() {
    return mongoClient_1.db.collection("videos").find({ type: "cartoon", posted: false }).toArray();
}
async function markVideoAsPosted(id) {
    return mongoClient_1.db.collection("videos").updateOne({ _id: id }, { $set: { posted: true, postedAt: new Date() } });
}
//# sourceMappingURL=videoStorage.js.map