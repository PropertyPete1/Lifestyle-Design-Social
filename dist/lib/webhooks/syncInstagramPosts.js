"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncInstagramPosts = syncInstagramPosts;
const axios_1 = __importDefault(require("axios"));
const mongoClient_1 = require("../db/mongoClient");
const tokenManager_1 = require("../auth/tokenManager");
async function syncInstagramPosts() {
    const token = await (0, tokenManager_1.getInstagramToken)();
    const userId = await (0, tokenManager_1.getInstagramUserId)();
    const res = await axios_1.default.get(`https://graph.facebook.com/v18.0/${userId}/media`, {
        params: {
            fields: "caption,timestamp",
            access_token: token,
            limit: 100,
        },
    });
    const posts = res.data.data;
    for (const post of posts) {
        if (post.caption) {
            await mongoClient_1.db.collection("captions").updateOne({ text: post.caption }, { $setOnInsert: { text: post.caption, createdAt: new Date(post.timestamp) } }, { upsert: true });
        }
    }
}
//# sourceMappingURL=syncInstagramPosts.js.map