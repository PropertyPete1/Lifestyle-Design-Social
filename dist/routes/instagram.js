"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const retryLogic_1 = require("../lib/posting/retryLogic");
const router = (0, express_1.Router)();
router.post('/post', async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).end('Method Not Allowed');
    const { videoId, caption, fileUrl } = req.body;
    if (!videoId || !caption || !fileUrl)
        return res.status(400).json({ error: 'Missing params' });
    const posted = await (0, retryLogic_1.tryPostingWithRetries)(videoId, caption, fileUrl);
    if (!posted)
        return res.status(500).json({ error: 'Post failed after retries' });
    res.status(200).json({ success: true });
});
exports.default = router;
//# sourceMappingURL=instagram.js.map