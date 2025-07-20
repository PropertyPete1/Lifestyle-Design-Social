"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitRequests = limitRequests;
const recentCalls = {};
function limitRequests(userId, limit = 5, windowMs = 60000) {
    const now = Date.now();
    const calls = recentCalls[userId] || [];
    const recent = calls.filter((t) => now - t < windowMs);
    if (recent.length >= limit)
        return false;
    recent.push(now);
    recentCalls[userId] = recent;
    return true;
}
//# sourceMappingURL=rateLimiter.js.map