"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDropboxVideo = downloadDropboxVideo;
const client_1 = require("./client");
async function downloadDropboxVideo(path) {
    try {
        const response = await client_1.dropboxClient.filesDownload({ path });
        return response.result.fileBinary;
    }
    catch (error) {
        console.error(`Failed to download Dropbox video at ${path}:`, error);
        throw error;
    }
}
//# sourceMappingURL=downloadVideo.js.map