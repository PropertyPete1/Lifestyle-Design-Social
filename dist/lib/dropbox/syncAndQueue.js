"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDropboxAndQueue = syncDropboxAndQueue;
const listVideos_1 = require("./listVideos");
const downloadVideo_1 = require("./downloadVideo");
const uploadToS3_1 = require("../upload/uploadToS3");
const queueManager_1 = require("../scheduler/queueManager");
async function syncDropboxAndQueue() {
    const videos = await (0, listVideos_1.listDropboxVideos)();
    for (const video of videos) {
        const buffer = await (0, downloadVideo_1.downloadDropboxVideo)(video.path_lower);
        const uploadResult = await (0, uploadToS3_1.uploadToS3)(Buffer.from(buffer), video.name, 'video/mp4');
        await (0, queueManager_1.enqueueVideo)({
            title: video.name,
            url: uploadResult,
            type: 'user',
        });
    }
}
//# sourceMappingURL=syncAndQueue.js.map