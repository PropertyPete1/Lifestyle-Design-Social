"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoQueue_1 = require("../lib/scheduler/videoQueue");
const retryLogic_1 = require("../lib/posting/retryLogic");
const logger_1 = require("../lib/posting/logger");
const router = (0, express_1.Router)();
router.post('/today', async (req, res) => {
    try {
        const videos = await (0, videoQueue_1.getTodayScheduledVideos)();
        let postedCount = 0;
        for (const video of videos) {
            const success = await (0, retryLogic_1.tryPostingWithRetries)(video.id, video.caption, video.fileUrl);
            if (success) {
                (0, logger_1.logSimplePostSuccess)(video.id);
                postedCount++;
            }
            else {
                (0, logger_1.logSimplePostFailure)(video.id, 'All retry attempts failed');
            }
        }
        res.status(200).json({ posted: postedCount, total: videos.length });
    }
    catch (error) {
        console.error('Daily posting failed:', error);
        res.status(500).json({ error: 'Daily posting failed' });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map