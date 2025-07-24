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
exports.analyzeVideoBuffer = analyzeVideoBuffer;
exports.compareFingerprints = compareFingerprints;
exports.createVideoSignature = createVideoSignature;
const crypto = __importStar(require("crypto"));
/**
 * Generate a fingerprint from video buffer
 * This creates a unique signature based on video characteristics
 */
function generateVideoFingerprint(buffer, metadata) {
    // Create content hash from buffer
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fingerprint = {
        fileSize: buffer.length,
        contentHash: contentHash.substring(0, 16), // First 16 chars for storage efficiency
    };
    // Add metadata if available (from multer or video analysis)
    if (metadata) {
        fingerprint.duration = metadata.duration;
        fingerprint.width = metadata.width;
        fingerprint.height = metadata.height;
        fingerprint.aspectRatio = metadata.width && metadata.height ?
            Math.round((metadata.width / metadata.height) * 100) / 100 : undefined;
        fingerprint.audioTrack = metadata.hasAudio;
    }
    return fingerprint;
}
/**
 * Simplified video analysis using basic buffer characteristics
 * This is a lightweight approach that doesn't require FFmpeg
 */
function analyzeVideoBuffer(buffer) {
    const fingerprint = {
        fileSize: buffer.length,
        contentHash: crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16)
    };
    // Simple heuristics for video analysis
    try {
        // Check for common video headers to estimate format
        const header = buffer.slice(0, 100).toString('hex');
        // MP4 detection
        if (header.includes('667479704d70') || header.includes('667479706973')) {
            fingerprint.aspectRatio = 16 / 9; // Common default
        }
        // MOV detection  
        if (header.includes('6674797071742020')) {
            fingerprint.aspectRatio = 16 / 9;
        }
        // Estimate duration based on file size (very rough)
        // Typical video bitrates: 1-10 Mbps
        const estimatedDurationSeconds = Math.round((buffer.length * 8) / (2 * 1024 * 1024)); // Assume 2Mbps avg
        if (estimatedDurationSeconds > 5 && estimatedDurationSeconds < 300) { // 5s to 5min range
            fingerprint.duration = estimatedDurationSeconds;
        }
    }
    catch (error) {
        console.log('Video analysis error (non-fatal):', (error === null || error === void 0 ? void 0 : error.message) || error);
    }
    return fingerprint;
}
/**
 * Compare two video fingerprints and return match confidence
 */
function compareFingerprints(fp1, fp2) {
    let score = 0;
    let factors = 0;
    // Content hash match (highest weight)
    if (fp1.contentHash === fp2.contentHash) {
        return 100; // Exact match
    }
    // File size similarity (±5%)
    if (fp1.fileSize && fp2.fileSize) {
        const sizeDiff = Math.abs(fp1.fileSize - fp2.fileSize) / Math.max(fp1.fileSize, fp2.fileSize);
        if (sizeDiff < 0.05)
            score += 40;
        else if (sizeDiff < 0.15)
            score += 20;
        factors++;
    }
    // Duration similarity (±10%)
    if (fp1.duration && fp2.duration) {
        const durationDiff = Math.abs(fp1.duration - fp2.duration) / Math.max(fp1.duration, fp2.duration);
        if (durationDiff < 0.1)
            score += 30;
        else if (durationDiff < 0.25)
            score += 15;
        factors++;
    }
    // Aspect ratio match
    if (fp1.aspectRatio && fp2.aspectRatio) {
        const ratioDiff = Math.abs(fp1.aspectRatio - fp2.aspectRatio);
        if (ratioDiff < 0.1)
            score += 20;
        else if (ratioDiff < 0.3)
            score += 10;
        factors++;
    }
    // Resolution similarity
    if (fp1.width && fp2.width && fp1.height && fp2.height) {
        const resolutionMatch = (fp1.width === fp2.width && fp1.height === fp2.height);
        if (resolutionMatch)
            score += 10;
        factors++;
    }
    // Audio track presence
    if (fp1.audioTrack !== undefined && fp2.audioTrack !== undefined) {
        if (fp1.audioTrack === fp2.audioTrack)
            score += 5;
        factors++;
    }
    // Normalize score based on available factors
    return factors > 0 ? Math.min(Math.round(score / factors * (factors / 5)), 100) : 0;
}
/**
 * Create a simple hash-based signature for quick comparison
 * This can be used for database indexing
 */
function createVideoSignature(fingerprint) {
    var _a, _b, _c;
    const components = [
        fingerprint.contentHash,
        (_a = fingerprint.fileSize) === null || _a === void 0 ? void 0 : _a.toString(),
        (_b = fingerprint.duration) === null || _b === void 0 ? void 0 : _b.toString(),
        (_c = fingerprint.aspectRatio) === null || _c === void 0 ? void 0 : _c.toString(),
    ].filter(Boolean);
    return crypto.createHash('md5').update(components.join('|')).digest('hex').substring(0, 12);
}
