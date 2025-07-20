"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodaySummary = getTodaySummary;
const mongoClient_1 = require("../db/mongoClient");
async function getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const posts = await mongoClient_1.db.collection("post_logs").find({ timestamp: { $gte: today } }).toArray();
    const metrics = await mongoClient_1.db.collection("daily_metrics").find({ trackedAt: { $gte: today } }).toArray();
    return { posts, metrics };
}
//# sourceMappingURL=summary.js.map