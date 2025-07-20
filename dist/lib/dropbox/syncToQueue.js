"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDropboxToQueue = syncDropboxToQueue;
const listVideos_1 = require("./listVideos");
const downloadVideo_1 = require("./downloadVideo");
const uploadToS3_1 = require("../upload/uploadToS3");
const videoQueue_1 = require("../scheduler/videoQueue");
async function syncDropboxToQueue() {
    const videos = await (0, listVideos_1.listDropboxVideos)();
    for (const video of videos) {
        const buffer = await (0, downloadVideo_1.downloadDropboxVideo)(video.path_lower);
        const uploadResult = await (0, uploadToS3_1.uploadToS3)(Buffer.from(buffer), video.name, 'video/mp4');
        await (0, videoQueue_1.addToQueue)(uploadResult, 'user');
    }
}
//# sourceMappingURL=syncToQueue.js.map