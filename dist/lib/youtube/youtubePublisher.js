"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToYouTube = postToYouTube;
const googleapis_1 = require("googleapis");
async function postToYouTube(title, description, filePath, accessToken) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = googleapis_1.google.youtube({ version: "v3", auth: oauth2Client });
    const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title,
                description,
            },
            status: {
                privacyStatus: "public",
            },
        },
        media: {
            body: require("fs").createReadStream(filePath),
        },
    });
    return res.data;
}
//# sourceMappingURL=youtubePublisher.js.map