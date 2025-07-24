"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeAudioTracks = void 0;
exports.fetchTrendingAudio = fetchTrendingAudio;
exports.getAudioTracksByCategory = getAudioTracksByCategory;
exports.getRandomAudioTrack = getRandomAudioTrack;
const mongoose_1 = __importDefault(require("mongoose"));
// MongoDB Schema for Audio Tracks
const AudioTrackSchema = new mongoose_1.default.Schema({
    audioTrackId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['hype', 'emotional', 'luxury', 'funny', 'chill']
    },
    sampleUrl: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now }
});
exports.YouTubeAudioTracks = mongoose_1.default.model('YouTubeAudioTracks', AudioTrackSchema);
// Simulated trending audio tracks (in production, this would scrape real data)
const TRENDING_AUDIO_SIMULATION = [
    // Hype category
    {
        audioTrackId: 'hype_001',
        title: 'Epic Victory Beat',
        category: 'hype',
        sampleUrl: 'https://example.com/audio/hype_001.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'hype_002',
        title: 'Motivation Rising',
        category: 'hype',
        sampleUrl: 'https://example.com/audio/hype_002.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'hype_003',
        title: 'Success Anthem',
        category: 'hype',
        sampleUrl: 'https://example.com/audio/hype_003.mp3',
        lastUpdated: new Date()
    },
    // Emotional category
    {
        audioTrackId: 'emotional_001',
        title: 'Heartfelt Piano',
        category: 'emotional',
        sampleUrl: 'https://example.com/audio/emotional_001.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'emotional_002',
        title: 'Family Moments',
        category: 'emotional',
        sampleUrl: 'https://example.com/audio/emotional_002.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'emotional_003',
        title: 'Touching Strings',
        category: 'emotional',
        sampleUrl: 'https://example.com/audio/emotional_003.mp3',
        lastUpdated: new Date()
    },
    // Luxury category
    {
        audioTrackId: 'luxury_001',
        title: 'Sophisticated Jazz',
        category: 'luxury',
        sampleUrl: 'https://example.com/audio/luxury_001.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'luxury_002',
        title: 'Elegant Orchestral',
        category: 'luxury',
        sampleUrl: 'https://example.com/audio/luxury_002.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'luxury_003',
        title: 'Premium Vibes',
        category: 'luxury',
        sampleUrl: 'https://example.com/audio/luxury_003.mp3',
        lastUpdated: new Date()
    },
    // Funny category
    {
        audioTrackId: 'funny_001',
        title: 'Comedy Gold',
        category: 'funny',
        sampleUrl: 'https://example.com/audio/funny_001.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'funny_002',
        title: 'Quirky Tune',
        category: 'funny',
        sampleUrl: 'https://example.com/audio/funny_002.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'funny_003',
        title: 'Laugh Track Beat',
        category: 'funny',
        sampleUrl: 'https://example.com/audio/funny_003.mp3',
        lastUpdated: new Date()
    },
    // Chill category
    {
        audioTrackId: 'chill_001',
        title: 'Ambient Relaxation',
        category: 'chill',
        sampleUrl: 'https://example.com/audio/chill_001.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'chill_002',
        title: 'Smooth Vibes',
        category: 'chill',
        sampleUrl: 'https://example.com/audio/chill_002.mp3',
        lastUpdated: new Date()
    },
    {
        audioTrackId: 'chill_003',
        title: 'Peaceful Moments',
        category: 'chill',
        sampleUrl: 'https://example.com/audio/chill_003.mp3',
        lastUpdated: new Date()
    }
];
/**
 * Fetches trending audio tracks (simulated for now)
 * In production, this would scrape actual YouTube Shorts trending audio
 */
async function fetchTrendingAudio() {
    try {
        console.log('🎵 Fetching trending audio tracks...');
        // Clear existing tracks and insert fresh ones
        await exports.YouTubeAudioTracks.deleteMany({});
        // Insert simulated trending tracks
        const insertedTracks = await exports.YouTubeAudioTracks.insertMany(TRENDING_AUDIO_SIMULATION);
        console.log(`✅ Successfully fetched ${insertedTracks.length} trending audio tracks`);
        return insertedTracks.map(track => ({
            audioTrackId: track.audioTrackId,
            title: track.title,
            category: track.category,
            sampleUrl: track.sampleUrl,
            lastUpdated: track.lastUpdated
        }));
    }
    catch (error) {
        console.error('❌ Error fetching trending audio:', error);
        throw error;
    }
}
/**
 * Gets audio tracks by category
 */
async function getAudioTracksByCategory(category) {
    try {
        const tracks = await exports.YouTubeAudioTracks.find({ category }).lean();
        return tracks.map(track => ({
            audioTrackId: track.audioTrackId,
            title: track.title,
            category: track.category,
            sampleUrl: track.sampleUrl,
            lastUpdated: track.lastUpdated
        }));
    }
    catch (error) {
        console.error(`❌ Error fetching ${category} audio tracks:`, error);
        return [];
    }
}
/**
 * Gets a random audio track from a specific category
 */
async function getRandomAudioTrack(category) {
    try {
        const tracks = await getAudioTracksByCategory(category);
        if (tracks.length === 0)
            return null;
        const randomIndex = Math.floor(Math.random() * tracks.length);
        return tracks[randomIndex];
    }
    catch (error) {
        console.error(`❌ Error getting random ${category} audio track:`, error);
        return null;
    }
}
