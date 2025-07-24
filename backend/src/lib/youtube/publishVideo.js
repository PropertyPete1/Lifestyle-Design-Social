"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishVideo = publishVideo;
const googleapis_1 = require("googleapis");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const videoQueue_1 = require("../../services/videoQueue");
const youtube = googleapis_1.google.youtube('v3');
// Function to download file from Dropbox URL to local storage
async function downloadFromDropbox(dropboxUrl, localPath) {
    return new Promise((resolve, reject) => {
        // Convert Dropbox share URL to direct download URL
        const downloadUrl = dropboxUrl.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        console.log(`📥 Downloading from Dropbox: ${downloadUrl}`);
        console.log(`📁 Saving to: ${localPath}`);
        // Ensure directory exists
        const dir = path_1.default.dirname(localPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const file = fs_1.default.createWriteStream(localPath);
        https_1.default.get(downloadUrl, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    console.log(`📍 Following redirect to: ${redirectUrl}`);
                    https_1.default.get(redirectUrl, (redirectResponse) => {
                        redirectResponse.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            console.log(`✅ Downloaded successfully: ${localPath}`);
                            resolve();
                        });
                    }).on('error', (err) => {
                        fs_1.default.unlink(localPath, () => { }); // Delete partial file
                        reject(new Error(`Download failed: ${err.message}`));
                    });
                    return;
                }
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded successfully: ${localPath}`);
                resolve();
            });
            file.on('error', (err) => {
                fs_1.default.unlink(localPath, () => { }); // Delete partial file
                reject(new Error(`File write error: ${err.message}`));
            });
        }).on('error', (err) => {
            reject(new Error(`Download request failed: ${err.message}`));
        });
    });
}
async function publishVideo({ videoId, title, description, tags, audioTrackId }) {
    try {
        // Get video from MongoDB
        const video = await videoQueue_1.VideoQueue.findById(videoId);
        if (!video) {
            throw new Error('Video not found in queue');
        }
        // Get video file path
        let videoPath;
        console.log('Video details:', {
            filePath: video.filePath,
            dropboxUrl: video.dropboxUrl,
            filename: video.filename
        });
        if (video.filePath && fs_1.default.existsSync(video.filePath)) {
            // File already exists locally with explicit filePath
            videoPath = video.filePath;
            console.log('Using existing file path:', videoPath);
        }
        else if (video.dropboxUrl && video.dropboxUrl.startsWith('local://')) {
            // Local storage with local:// URL format - construct path
            const localFilename = video.dropboxUrl.replace('local://', '');
            // Ensure we get the project root, not the backend subdirectory
            const projectRoot = process.cwd().endsWith('backend') ? path_1.default.dirname(process.cwd()) : process.cwd();
            const uploadsDir = path_1.default.join(projectRoot, 'uploads');
            videoPath = path_1.default.join(uploadsDir, localFilename);
            console.log('Constructed local file path from URL:', videoPath);
            if (!fs_1.default.existsSync(videoPath)) {
                throw new Error(`Local video file not found. Expected at: ${videoPath}`);
            }
            // Save the filePath to the database for future use
            try {
                await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, { filePath: videoPath });
                console.log('Updated video with filePath:', videoPath);
            }
            catch (updateError) {
                console.warn('Failed to update filePath in database:', updateError);
            }
        }
        else if (video.dropboxUrl && video.dropboxUrl.startsWith('http')) {
            // Dropbox URL - download to local storage first
            const filename = video.filename;
            const projectRoot = process.cwd().endsWith('backend') ? path_1.default.dirname(process.cwd()) : process.cwd();
            const uploadsDir = path_1.default.join(projectRoot, 'uploads');
            videoPath = path_1.default.join(uploadsDir, filename);
            console.log('Handling Dropbox video:', videoPath);
            // Check if file already exists locally
            if (!fs_1.default.existsSync(videoPath)) {
                console.log('📥 File not found locally, downloading from Dropbox...');
                try {
                    await downloadFromDropbox(video.dropboxUrl, videoPath);
                    // Update the video record with the local file path
                    try {
                        await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, { filePath: videoPath });
                        console.log('💾 Updated video with local filePath:', videoPath);
                    }
                    catch (updateError) {
                        console.warn('⚠️ Failed to update filePath in database:', updateError);
                    }
                }
                catch (downloadError) {
                    throw new Error(`Failed to download video from Dropbox: ${(downloadError === null || downloadError === void 0 ? void 0 : downloadError.message) || downloadError}`);
                }
            }
            else {
                console.log('✅ File already exists locally, using existing file');
            }
        }
        else {
            throw new Error(`No valid file path or Dropbox URL found. filePath: ${video.filePath}, dropboxUrl: ${video.dropboxUrl}`);
        }
        // Get YouTube credentials from settings
        const settingsPath = path_1.default.resolve(__dirname, '../../../../frontend/settings.json');
        let apiKey = process.env.YOUTUBE_API_KEY;
        let clientId = process.env.YOUTUBE_CLIENT_ID;
        let clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        let refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        if (fs_1.default.existsSync(settingsPath)) {
            try {
                const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf-8'));
                apiKey = settings.youtubeApiKey || apiKey;
                clientId = settings.youtubeClientId || clientId;
                clientSecret = settings.youtubeClientSecret || clientSecret;
                refreshToken = settings.youtubeRefreshToken || refreshToken;
            }
            catch (e) {
                // Ignore parse errors
            }
        }
        if (!apiKey) {
            throw new Error('YouTube API key not found. Please add it in Settings.');
        }
        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('YouTube OAuth credentials (Client ID, Client Secret, Refresh Token) not found. Please add them in Settings.');
        }
        // Prepare video metadata
        const videoMetadata = {
            snippet: {
                title: title.substring(0, 100), // YouTube title limit
                description: description.substring(0, 5000), // YouTube description limit
                tags: tags.slice(0, 15), // YouTube tags limit
                categoryId: '22', // People & Blogs category
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false
            }
        };
        // Configure OAuth2 client
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob' // Standard redirect URI for installed apps
        );
        // Set credentials
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        googleapis_1.google.options({ auth: oauth2Client });
        // Upload video to YouTube
        const fileSize = fs_1.default.statSync(videoPath).size;
        const response = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: videoMetadata,
            media: {
                body: fs_1.default.createReadStream(videoPath)
            }
        });
        const youtubeVideoId = response.data.id;
        if (!youtubeVideoId) {
            throw new Error('Failed to upload video to YouTube');
        }
        // Update video status in MongoDB
        await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, {
            status: 'posted',
            datePosted: new Date(),
            youtubeVideoId: youtubeVideoId,
            publishedTitle: title,
            publishedDescription: description,
            publishedTags: tags
        });
        console.log(`✅ Video published to YouTube: ${youtubeVideoId}`);
        return {
            success: true,
            youtubeVideoId
        };
    }
    catch (error) {
        console.error('❌ Failed to publish video:', error);
        // Update video status to failed
        await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
