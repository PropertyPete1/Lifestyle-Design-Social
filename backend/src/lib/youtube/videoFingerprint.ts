import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoFingerprint {
  hash: string;
  size: number;
  duration?: number;
}

/**
 * Generate a fingerprint for a video buffer to detect duplicates
 * Uses combination of file size, hash of first chunk, and video metadata
 */
export function generateVideoFingerprint(buffer: Buffer, filename: string): VideoFingerprint {
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
export function compareFingerprints(
  fp1: VideoFingerprint, 
  fp2: VideoFingerprint,
  sizeTolerance: number = 0.02 // 2% size tolerance
): { isMatch: boolean; confidence: number } {
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
export async function findDuplicateVideo(
  fingerprint: VideoFingerprint,
  videoQueue: any,
  minDaysBeforeRepost: number = 20
): Promise<{ isDuplicate: boolean; lastPosted?: Date; originalVideo?: any; daysSinceLastPost?: number }> {
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
      const comparison = compareFingerprints(
        fingerprint,
        { hash: video.videoHash, size: video.videoSize, duration: video.videoDuration }
      );
      
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

/**
 * Get repost cooldown settings from settings.json
 */
export function getRepostSettings(): { minDaysBeforeRepost: number } {
  const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return {
        minDaysBeforeRepost: settings.minDaysBeforeRepost || 20
      };
    } catch (e) {
      console.error('Failed to read settings.json:', e);
    }
  }
  return { minDaysBeforeRepost: 20 };
} 