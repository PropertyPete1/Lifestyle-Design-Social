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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoFingerprint = generateVideoFingerprint;
exports.compareFingerprints = compareFingerprints;
exports.findDuplicateVideo = findDuplicateVideo;
const crypto = __importStar(require("crypto"));
/**
 * Generate a fingerprint for a video buffer to detect duplicates
 * Uses combination of file size, hash of first chunk, and video metadata
 */
function generateVideoFingerprint(buffer, filename) {
    const size = buffer.length;
    // Create hash from first 64KB + last 64KB + size + filename pattern
    const chunkSize = Math.min(64 * 1024, Math.floor(size / 4));
    const firstChunk = buffer.slice(0, chunkSize);
    const lastChunk = buffer.slice(-chunkSize);
    // Extract filename without timestamp prefixes and extensions for content matching
    const normalizedFilename = filename
        .replace(/^\d+_/, '') // Remove timestamp prefix
        .replace(/\.[^/.]+$/, '') // Remove extension
        .toLowerCase();
    const hash = crypto.createHash('sha256');
    hash.update(firstChunk);
    hash.update(lastChunk);
    hash.update(Buffer.from(size.toString()));
    hash.update(Buffer.from(normalizedFilename));
    return {
        hash: hash.digest('hex'),
        size,
        duration: undefined // Will be filled by video processing if available
    };
}
/**
 * Check if two video fingerprints match (considering size tolerance)
 */
function compareFingerprints(fp1, fp2, sizeTolerance = 0.02 // 2% size tolerance
) {
    // Exact hash match = 100% confidence
    if (fp1.hash === fp2.hash) {
        return { isMatch: true, confidence: 100 };
    }
    // Check size similarity
    const sizeDiff = Math.abs(fp1.size - fp2.size) / Math.max(fp1.size, fp2.size);
    if (sizeDiff <= sizeTolerance) {
        // Similar size but different hash - possible re-encode or slight modification
        const confidence = Math.max(0, 90 - (sizeDiff * 1000)); // Reduce confidence based on size difference
        return { isMatch: confidence > 70, confidence: Math.round(confidence) };
    }
    return { isMatch: false, confidence: 0 };
}
/**
 * Find duplicate videos in the database based on fingerprint
 */
async function findDuplicateVideo(fingerprint, videoQueue, minDaysBeforeRepost = 20) {
    // Look for exact hash matches first
    const exactMatch = await videoQueue.findOne({
        videoHash: fingerprint.hash,
        status: { $in: ['posted', 'scheduled'] }
    }).sort({ lastPostedAt: -1 });
    if (exactMatch) {
        const daysSince = exactMatch.lastPostedAt
            ? Math.floor((Date.now() - exactMatch.lastPostedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        return {
            isDuplicate: daysSince < minDaysBeforeRepost,
            lastPosted: exactMatch.lastPostedAt,
            originalVideo: exactMatch,
            daysSinceLastPost: daysSince
        };
    }
    // Look for similar size videos (potential re-encodes)
    const sizeTolerance = fingerprint.size * 0.02; // 2% tolerance
    const similarVideos = await videoQueue.find({
        videoSize: {
            $gte: fingerprint.size - sizeTolerance,
            $lte: fingerprint.size + sizeTolerance
        },
        status: { $in: ['posted', 'scheduled'] }
    }).sort({ lastPostedAt: -1 });
    for (const video of similarVideos) {
        if (video.videoHash) {
            const comparison = compareFingerprints(fingerprint, { hash: video.videoHash, size: video.videoSize, duration: video.videoDuration });
            if (comparison.isMatch) {
                const daysSince = video.lastPostedAt
                    ? Math.floor((Date.now() - video.lastPostedAt.getTime()) / (1000 * 60 * 60 * 24))
                    : 999;
                return {
                    isDuplicate: daysSince < minDaysBeforeRepost,
                    lastPosted: video.lastPostedAt,
                    originalVideo: video,
                    daysSinceLastPost: daysSince
                };
            }
        }
    }
    return { isDuplicate: false };
}
