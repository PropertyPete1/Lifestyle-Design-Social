"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearOldCartoons = clearOldCartoons;
const mongoClient_1 = require("../db/mongoClient");
async function clearOldCartoons() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await mongoClient_1.db.collection("video_queue").deleteMany({
        type: "cartoon",
        uploadedAt: { $lt: thirtyDaysAgo },
    });
}
//# sourceMappingURL=clearOldCartoons.js.map