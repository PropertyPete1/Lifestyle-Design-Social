"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstagramToken = getInstagramToken;
exports.getInstagramUserId = getInstagramUserId;
const mongoClient_1 = require("../db/mongoClient");
async function getInstagramToken() {
    const account = await mongoClient_1.db.collection("auth").findOne({ platform: "instagram" });
    if (!account)
        throw new Error("No Instagram token found.");
    return account.accessToken;
}
async function getInstagramUserId() {
    const account = await mongoClient_1.db.collection("auth").findOne({ platform: "instagram" });
    if (!account)
        throw new Error("No Instagram user ID found.");
    return account.userId;
}
//# sourceMappingURL=tokenManager.js.map