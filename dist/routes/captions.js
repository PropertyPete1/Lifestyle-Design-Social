"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mimicCaption_1 = require("../lib/captions/mimicCaption");
const captionMimicry_1 = require("../lib/captions/captionMimicry");
const syncInstagramPosts_1 = require("../webhooks/syncInstagramPosts");
const getBestCaptions_1 = require("../lib/api/handlers/getBestCaptions");
const captionStorage_1 = require("../lib/db/captionStorage");
const gptCaptionMimic_1 = require("../lib/ai/gptCaptionMimic");
const gptCaptionRewriter_1 = require("../lib/captions/gptCaptionRewriter");
const replaceHashtags_1 = require("../lib/hashtags/replaceHashtags");
const router = (0, express_1.Router)();
router.get('/best', async (req, res) => {
    if (req.method !== 'GET')
        return res.status(405).end('Method Not Allowed');
    try {
        const captions = await (0, getBestCaptions_1.getBestCaptions)();
        res.status(200).json({ captions });
    }
    catch (err) {
        console.error('Get captions failed:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});
router.post('/mimic', async (req, res) => {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid topic' });
    }
    try {
        const caption = await (0, mimicCaption_1.mimicCaption)(topic);
        res.status(200).json({ caption });
    }
    catch (err) {
        console.error('Error generating caption:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/mimic-enhance', async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).end('Method Not Allowed');
    const { baseCaption } = req.body;
    if (!baseCaption)
        return res.status(400).json({ error: 'Missing baseCaption' });
    try {
        const newCaption = await (0, captionMimicry_1.mimicSuccessfulCaption)(baseCaption);
        res.status(200).json({ caption: newCaption });
    }
    catch (err) {
        console.error('Caption mimicry failed:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});
router.post('/sync', async (req, res) => {
    try {
        await (0, syncInstagramPosts_1.syncInstagramCaptions)();
        res.status(200).json({ status: 'Synced' });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to sync' });
    }
});
router.post('/mimic-gpt', async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).end('Method Not Allowed');
    const { baseCaption } = req.body;
    if (!baseCaption)
        return res.status(400).json({ error: 'Missing baseCaption' });
    try {
        const topCaptions = await (0, captionStorage_1.fetchTopCaptionsFromDB)();
        const generated = await (0, gptCaptionMimic_1.gptMimicCaption)(baseCaption, topCaptions);
        res.status(200).json({ caption: generated });
    }
    catch (err) {
        console.error('Caption mimic failed:', err);
        res.status(500).json({ error: 'Mimic error' });
    }
});
router.post('/rewrite', async (req, res) => {
    const { baseCaption } = req.body;
    if (!baseCaption) {
        return res.status(400).json({ error: 'Missing baseCaption' });
    }
    try {
        const rewritten = await (0, gptCaptionRewriter_1.rewriteCaptionWithStyle)(baseCaption);
        return res.status(200).json({ rewritten });
    }
    catch (error) {
        console.error('Caption rewrite error:', error);
        return res.status(500).json({ error: 'Failed to rewrite caption' });
    }
});
router.post('/fullEnhance', async (req, res) => {
    const { baseCaption } = req.body;
    if (!baseCaption) {
        return res.status(400).json({ error: 'Missing baseCaption' });
    }
    try {
        const rewritten = await (0, gptCaptionRewriter_1.rewriteCaptionWithStyle)(baseCaption);
        const final = await (0, replaceHashtags_1.replaceHashtags)(rewritten);
        return res.status(200).json({ final });
    }
    catch (error) {
        console.error('Full enhance error:', error);
        return res.status(500).json({ error: 'Failed to enhance caption' });
    }
});
exports.default = router;
//# sourceMappingURL=captions.js.map