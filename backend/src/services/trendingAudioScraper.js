"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendingAudioScraper = void 0;
const axios_1 = __importDefault(require("axios"));
class TrendingAudioScraper {
    constructor() {
        this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
        this.instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    }
    /**
     * Fetch trending audio from YouTube Music/Shorts
     */
    async fetchYouTubeTrendingAudio() {
        try {
            if (!this.youtubeApiKey) {
                console.warn('YouTube API key not configured for trending audio');
                return [];
            }
            // YouTube Music Charts API endpoint
            const response = await axios_1.default.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    part: 'snippet,statistics',
                    chart: 'mostPopular',
                    videoCategoryId: '10', // Music category
                    maxResults: 50,
                    regionCode: 'US',
                    key: this.youtubeApiKey
                }
            });
            const trendingAudio = response.data.items.map((item, index) => {
                var _a;
                return ({
                    title: item.snippet.title,
                    artist: this.extractArtistFromTitle(item.snippet.title),
                    duration: this.parseDuration((_a = item.contentDetails) === null || _a === void 0 ? void 0 : _a.duration),
                    trending_rank: index + 1,
                    platform_audio_id: item.id,
                    category: item.snippet.categoryId,
                    keywords: this.extractKeywords(item.snippet.title + ' ' + item.snippet.description),
                    platform: 'youtube'
                });
            });
            return trendingAudio;
        }
        catch (error) {
            console.error('Error fetching YouTube trending audio:', error);
            return [];
        }
    }
    /**
     * Fetch trending audio from Instagram Reels
     */
    async fetchInstagramTrendingAudio() {
        var _a;
        try {
            if (!this.instagramToken) {
                console.warn('Instagram access token not configured for trending audio');
                return [];
            }
            // Instagram Graph API for trending audio tracks
            const response = await axios_1.default.get(`https://graph.instagram.com/v18.0/ig_hashtag_search`, {
                params: {
                    user_id: process.env.INSTAGRAM_USER_ID,
                    q: 'trending,music,audio',
                    access_token: this.instagramToken
                }
            });
            // Note: Instagram's API is more limited for trending audio
            // This is a simplified implementation - in production you might use third-party services
            const trendingAudio = ((_a = response.data.data) === null || _a === void 0 ? void 0 : _a.slice(0, 20).map((item, index) => {
                var _a;
                return ({
                    title: item.name || 'Trending Audio',
                    artist: 'Unknown',
                    duration: 30, // Default for Instagram Reels
                    trending_rank: index + 1,
                    platform_audio_id: item.id,
                    category: 'reels',
                    keywords: [((_a = item.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'trending'],
                    platform: 'instagram'
                });
            })) || [];
            return trendingAudio;
        }
        catch (error) {
            console.error('Error fetching Instagram trending audio:', error);
            return [];
        }
    }
    /**
     * Get all trending audio from both platforms
     */
    async getAllTrendingAudio() {
        const [youtubeAudio, instagramAudio] = await Promise.all([
            this.fetchYouTubeTrendingAudio(),
            this.fetchInstagramTrendingAudio()
        ]);
        return [...youtubeAudio, ...instagramAudio];
    }
    /**
     * Extract artist name from YouTube title (basic implementation)
     */
    extractArtistFromTitle(title) {
        // Common patterns: "Artist - Song", "Song by Artist", "Artist: Song"
        const patterns = [
            /^([^-]+)\s*-\s*.+/,
            /.+\s+by\s+([^|]+)/i,
            /^([^:]+):\s*.+/
        ];
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        return 'Unknown Artist';
    }
    /**
     * Parse YouTube duration format (PT4M13S)
     */
    parseDuration(duration) {
        if (!duration)
            return undefined;
        const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match)
            return undefined;
        const minutes = parseInt(match[1] || '0');
        const seconds = parseInt(match[2] || '0');
        return minutes * 60 + seconds;
    }
    /**
     * Extract keywords from text for matching
     */
    extractKeywords(text) {
        const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word))
            .slice(0, 10); // Limit to top 10 keywords
    }
}
exports.TrendingAudioScraper = TrendingAudioScraper;
