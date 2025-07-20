"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listVideos_1 = require("../lib/dropbox/listVideos");
const downloadVideo_1 = require("../lib/dropbox/downloadVideo");
const uploadToS3_1 = require("../lib/upload/uploadToS3");
const router = (0, express_1.Router)();
router.post('/sync', async (req, res) => {
    try {
        const videos = await (0, listVideos_1.listDropboxVideos)();
        const uploads = [];
        for (const video of videos) {
            const buffer = await (0, downloadVideo_1.downloadDropboxVideo)(video.path_lower);
            const uploadResult = await (0, uploadToS3_1.uploadToS3)(Buffer.from(buffer), video.name, 'video/mp4');
            uploads.push(uploadResult);
        }
        res.status(200).json({ message: 'Synced from Dropbox', count: uploads.length });
    }
    catch (err) {
        console.error('Dropbox sync failed:', err);
        res.status(500).json({ error: 'Failed to sync from Dropbox' });
    }
});
exports.default = router;
//# sourceMappingURL=dropbox.js.map