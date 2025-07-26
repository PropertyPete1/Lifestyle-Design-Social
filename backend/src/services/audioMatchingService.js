"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioMatchingService = void 0;
const AudioMatch_1 = require("../models/AudioMatch");
const VideoStatus_1 = require("../models/VideoStatus");
const YouTubeVideo_1 = __importDefault(require("../models/YouTubeVideo"));
const trendingAudioScraper_1 = require("./trendingAudioScraper");
class AudioMatchingService {
    constructor() {
        this.audioScraper = new trendingAudioScraper_1.TrendingAudioScraper();
    }
    /**
     * Match a single video with trending audio
     */
    async matchVideoWithAudio(videoId) {
        try {
            // Get video data
            const videoData = await this.getVideoData(videoId);
            if (!videoData) {
                console.warn(`Video data not found for videoId: ${videoId}`);
                return null;
            }
            // Get trending audio for the platform
            const trendingAudio = await this.getTrendingAudioForPlatform(videoData.platform);
            if (trendingAudio.length === 0) {
                console.warn(`No trending audio found for platform: ${videoData.platform}`);
                return null;
            }
            // Find best audio match
            const bestMatch = this.findBestAudioMatch(videoData, trendingAudio);
            if (!bestMatch) {
                console.warn(`No suitable audio match found for videoId: ${videoId}`);
                return null;
            }
            // Save the match to database
            const audioMatch = new AudioMatch_1.AudioMatch({
                videoId: videoData.videoId,
                matchedAudio: bestMatch.audio.title,
                platform: videoData.platform,
                audioMetadata: {
                    title: bestMatch.audio.title,
                    artist: bestMatch.audio.artist,
                    duration: bestMatch.audio.duration,
                    trending_rank: bestMatch.audio.trending_rank,
                    platform_audio_id: bestMatch.audio.platform_audio_id,
                    category: bestMatch.audio.category
                },
                matchingFactors: bestMatch.matchingFactors,
                status: 'matched'
            });
            await audioMatch.save();
            console.log(`✅ Audio matched for video ${videoId}: ${bestMatch.audio.title} (Score: ${bestMatch.matchingFactors.overallScore})`);
            return audioMatch;
        }
        catch (error) {
            console.error(`Error matching audio for video ${videoId}:`, error);
            return null;
        }
    }
    /**
     * Match all pending videos with trending audio
     */
    async matchAllPendingVideos() {
        try {
            // Get all videos that don't have audio matches yet
            const videoStatuses = await VideoStatus_1.VideoStatus.find({
                status: { $in: ['ready', 'pending'] }
            });
            const matches = [];
            for (const videoStatus of videoStatuses) {
                // Check if already has a recent audio match
                const existingMatch = await AudioMatch_1.AudioMatch.findOne({
                    videoId: videoStatus.videoId,
                    matchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                });
                if (!existingMatch) {
                    const match = await this.matchVideoWithAudio(videoStatus.videoId);
                    if (match) {
                        matches.push(match);
                    }
                }
            }
            console.log(`🎵 Matched ${matches.length} videos with trending audio`);
            return matches;
        }
        catch (error) {
            console.error('Error matching all pending videos:', error);
            return [];
        }
    }
    /**
     * Get video data from database
     */
    async getVideoData(videoId) {
        try {
            // First try to get from VideoStatus
            const videoStatus = await VideoStatus_1.VideoStatus.findOne({ videoId });
            if (!videoStatus) {
                return null;
            }
            // Try to get additional data from YouTubeVideo if it's a YouTube video
            if (videoStatus.platform === 'youtube') {
                const youtubeVideo = await YouTubeVideo_1.default.findOne({ videoId });
                if (youtubeVideo) {
                    return {
                        videoId,
                        platform: videoStatus.platform,
                        title: youtubeVideo.title,
                        description: youtubeVideo.description,
                        tags: youtubeVideo.tags || [],
                        keywords: this.extractKeywords(youtubeVideo.title + ' ' + youtubeVideo.description)
                    };
                }
            }
            // Fallback to basic data from VideoStatus
            return {
                videoId,
                platform: videoStatus.platform,
                title: videoStatus.filename.replace(/\.(mp4|mov|avi)$/i, ''),
                description: '',
                tags: [],
                keywords: this.extractKeywords(videoStatus.filename)
            };
        }
        catch (error) {
            console.error(`Error getting video data for ${videoId}:`, error);
            return null;
        }
    }
    /**
     * Get trending audio for specific platform
     */
    async getTrendingAudioForPlatform(platform) {
        if (platform === 'youtube') {
            return await this.audioScraper.fetchYouTubeTrendingAudio();
        }
        else {
            return await this.audioScraper.fetchInstagramTrendingAudio();
        }
    }
    /**
     * Find the best audio match for a video
     */
    findBestAudioMatch(video, trendingAudio) {
        let bestMatch = null;
        let bestScore = 0;
        for (const audio of trendingAudio) {
            const matchingFactors = this.calculateMatchingScore(video, audio);
            if (matchingFactors.overallScore > bestScore && matchingFactors.overallScore >= 30) { // Minimum 30% match
                bestScore = matchingFactors.overallScore;
                bestMatch = {
                    audio,
                    matchingFactors
                };
            }
        }
        return bestMatch;
    }
    /**
     * Calculate matching score between video and audio
     */
    calculateMatchingScore(video, audio) {
        // Topic matching (based on title similarity)
        const topicMatch = this.calculateTextSimilarity(video.title, audio.title);
        // Keyword matching
        const videoKeywords = [...video.keywords, ...video.tags];
        const audioKeywords = audio.keywords;
        const keywordMatch = this.calculateKeywordOverlap(videoKeywords, audioKeywords);
        // Category matching (basic implementation)
        const categoryMatch = this.calculateCategoryMatch(video, audio);
        // Overall score with weights
        const overallScore = Math.round((topicMatch * 0.4) + // 40% weight on topic match
            (keywordMatch * 0.4) + // 40% weight on keyword match
            (categoryMatch * 0.2) // 20% weight on category match
        );
        return {
            topicMatch: Math.round(topicMatch),
            keywordMatch: Math.round(keywordMatch),
            categoryMatch: Math.round(categoryMatch),
            overallScore
        };
    }
    /**
     * Calculate text similarity between two strings
     */
    calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    }
    /**
     * Calculate keyword overlap percentage
     */
    calculateKeywordOverlap(keywords1, keywords2) {
        if (keywords1.length === 0 || keywords2.length === 0)
            return 0;
        const set1 = new Set(keywords1.map(k => k.toLowerCase()));
        const set2 = new Set(keywords2.map(k => k.toLowerCase()));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    }
    /**
     * Calculate category matching score
     */
    calculateCategoryMatch(video, audio) {
        var _a;
        // Basic category matching - can be enhanced with more sophisticated logic
        const videoCategories = video.tags.map(tag => tag.toLowerCase());
        const audioCategory = ((_a = audio.category) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        // Check for real estate related content
        const realEstateKeywords = ['real estate', 'property', 'home', 'house', 'apartment', 'condo', 'mortgage', 'realtor'];
        const hasRealEstate = videoCategories.some(cat => realEstateKeywords.some(keyword => cat.includes(keyword)));
        if (hasRealEstate) {
            // For real estate content, prefer trending/popular audio over specific genre matches
            return audio.trending_rank <= 20 ? 80 : 50; // High score for top 20 trending
        }
        // Generic category matching
        if (audioCategory && videoCategories.includes(audioCategory)) {
            return 90;
        }
        return 40; // Base score for any trending audio
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word))
            .slice(0, 10);
    }
}
exports.AudioMatchingService = AudioMatchingService;
