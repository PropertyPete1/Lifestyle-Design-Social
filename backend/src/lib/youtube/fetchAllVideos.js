"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllVideosFromChannel = fetchAllVideosFromChannel;
exports.getAllSavedVideos = getAllSavedVideos;
const axios_1 = __importDefault(require("axios"));
const connection_1 = require("../../database/connection");
const YouTubeVideo_1 = __importDefault(require("../../models/YouTubeVideo"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function fetchAllVideosFromChannel(channelId) {
    var _a, _b, _c, _d, _e, _f;
    await (0, connection_1.connectToDatabase)();
    // Get YouTube API key from settings
    const settingsPath = path.resolve(__dirname, '../../../../frontend/settings.json');
    let apiKey = process.env.YOUTUBE_API_KEY;
    if (fs.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            apiKey = settings.youtubeApiKey || apiKey;
        }
        catch (e) {
            // Ignore parse errors
        }
    }
    if (!apiKey) {
        throw new Error('YouTube API key not found. Please add it in Settings.');
    }
    const baseUrl = 'https://www.googleapis.com/youtube/v3';
    const savedVideos = [];
    let nextPageToken = '';
    let totalFetched = 0;
    try {
        do {
            // Step 1: Get list of video IDs from channel
            const searchUrl = `${baseUrl}/search?key=${apiKey}&channelId=${channelId}&part=id,snippet&order=date&type=video&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            console.log(`Fetching videos page ${totalFetched / 50 + 1}...`);
            const searchResponse = await axios_1.default.get(searchUrl);
            if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
                break;
            }
            const videoIds = searchResponse.data.items.map((item) => item.id.videoId);
            // Step 2: Get detailed statistics for these videos
            const detailsUrl = `${baseUrl}/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,statistics`;
            const detailsResponse = await axios_1.default.get(detailsUrl);
            // Step 3: Process and save videos
            for (const video of detailsResponse.data.items) {
                try {
                    // Check if video already exists
                    const existingVideo = await YouTubeVideo_1.default.findOne({ videoId: video.id });
                    if (existingVideo) {
                        // Update existing video with latest stats
                        existingVideo.viewCount = parseInt(video.statistics.viewCount) || 0;
                        existingVideo.likeCount = parseInt(video.statistics.likeCount) || 0;
                        await existingVideo.save();
                        savedVideos.push(existingVideo);
                    }
                    else {
                        // Create new video record
                        const newVideo = new YouTubeVideo_1.default({
                            videoId: video.id,
                            title: video.snippet.title,
                            description: video.snippet.description || '',
                            tags: video.snippet.tags || [],
                            viewCount: parseInt(video.statistics.viewCount) || 0,
                            likeCount: parseInt(video.statistics.likeCount) || 0,
                            publishedAt: video.snippet.publishedAt,
                            alreadyPosted: false
                        });
                        await newVideo.save();
                        savedVideos.push(newVideo);
                    }
                    totalFetched++;
                }
                catch (error) {
                    console.error(`Error saving video ${video.id}:`, error);
                }
            }
            nextPageToken = searchResponse.data.nextPageToken;
            // Rate limiting - YouTube API has quota limits
            if (nextPageToken) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
            }
        } while (nextPageToken && totalFetched < 1000); // Limit to 1000 videos max per request
        console.log(`Successfully fetched ${totalFetched} videos from channel ${channelId}`);
        return savedVideos;
    }
    catch (error) {
        console.error('YouTube API Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 403) {
            throw new Error('YouTube API quota exceeded or invalid API key. Please check your API key and quota in Google Cloud Console.');
        }
        else if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 404) {
            throw new Error('YouTube channel not found. Please check the Channel ID.');
        }
        else {
            throw new Error(`YouTube API error: ${((_f = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.message) || error.message}`);
        }
    }
}
async function getAllSavedVideos() {
    await (0, connection_1.connectToDatabase)();
    return YouTubeVideo_1.default.find().sort({ viewCount: -1 }).exec();
}
