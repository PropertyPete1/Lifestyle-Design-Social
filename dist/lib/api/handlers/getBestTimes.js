"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const viewerActivity_1 = require("../../analytics/viewerActivity");
async function handler(req, res) {
    const hours = await (0, viewerActivity_1.getBestPostingHours)();
    return res.status(200).json({ hours });
}
//# sourceMappingURL=getBestTimes.js.map