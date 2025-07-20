"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDropboxVideos = listDropboxVideos;
const client_1 = require("./client");
async function listDropboxVideos(folderPath = '/videos') {
    try {
        const response = await client_1.dropboxClient.filesListFolder({ path: folderPath });
        return response.result.entries.filter((entry) => entry.name.endsWith('.mp4'));
    }
    catch (error) {
        console.error('Error listing Dropbox videos:', error);
        return [];
    }
}
//# sourceMappingURL=listVideos.js.map