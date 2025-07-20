"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postLogger_1 = require("../lib/analytics/postLogger");
const router = (0, express_1.Router)();
router.post('/log', async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).end('Method Not Allowed');
    const { videoId, caption, views } = req.body;
    if (!caption || typeof views !== 'number') {
        return res.status(400).json({ error: 'Missing data' });
    }
    try {
        await (0, postLogger_1.logPostAnalytics)(videoId, caption, views);
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('Analytics logging failed:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map