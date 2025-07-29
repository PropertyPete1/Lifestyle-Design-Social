import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoFingerprint {
  hash: string;
  size: number;
  duration?: number;
  sha256Hash?: string; // Enhanced SHA256 hash for Phase 1
  perceptualHash?: string; // Perceptual hash for content similarity
  contentSignature?: string; // Additional content signature
}

/**
 * Enhanced video fingerprinting for Phase 1 with SHA256 and perceptual hashing
 * Generates multiple hashes to detect duplicates even with slight modifications
 */
export function generateVideoFingerprint(buffer: Buffer, filename: string): VideoFingerprint {
  const size = buffer.length;
  
  // Primary hash: combination of first/last chunks + metadata (existing method)
  const chunkSize = Math.min(64 * 1024, Math.floor(size / 4));
  const firstChunk = buffer.slice(0, chunkSize);
  const lastChunk = buffer.slice(-chunkSize);
  
  // Extract filename without timestamp prefixes and extensions for content matching
  const normalizedFilename = filename
    .replace(/^\d+_/, '') // Remove timestamp prefix
    .replace(/\.[^/.]+$/, '') // Remove extension
    .toLowerCase();
  
  const primaryHash = crypto.createHash('sha256');
  primaryHash.update(firstChunk);
  primaryHash.update(lastChunk);
  primaryHash.update(Buffer.from(size.toString()));
  primaryHash.update(Buffer.from(normalizedFilename));
  
  // SHA256 hash of entire file for exact duplicate detection
  const sha256Hash = crypto.createHash('sha256');
  sha256Hash.update(buffer);
  const fullFileHash = sha256Hash.digest('hex');
  
  // Perceptual hash: Create hash based on file structure patterns
  const perceptualHash = generatePerceptualHash(buffer, size);
  
  // Content signature: Hash of multiple points in the file for similarity detection
  const contentSignature = generateContentSignature(buffer, size);
  
  return {
    hash: primaryHash.digest('hex'),
    size,
    duration: undefined, // Will be filled by video processing if available
    sha256Hash: fullFileHash,
    perceptualHash,
    contentSignature
  };
}

/**
 * Generate perceptual hash based on file structure patterns
 * This helps detect videos that are the same content but different encoding
 */
function generatePerceptualHash(buffer: Buffer, size: number): string {
  const samplePoints = 16; // Number of sample points throughout the file
  const sampleSize = 1024; // Size of each sample
  const hash = crypto.createHash('md5');
  
  for (let i = 0; i < samplePoints; i++) {
    const position = Math.floor((size / samplePoints) * i);
    const endPosition = Math.min(position + sampleSize, size);
    const sample = buffer.slice(position, endPosition);
    
    // Add sample byte sum to hash (content-aware sampling)
    const byteSum = Array.from(sample).reduce((sum, byte) => sum + byte, 0);
    hash.update(Buffer.from(byteSum.toString()));
  }
  
  return hash.digest('hex');
}

/**
 * Generate content signature from multiple file sections
 * This provides another layer of similarity detection
 */
function generateContentSignature(buffer: Buffer, size: number): string {
  const hash = crypto.createHash('sha256');
  
  // Sample from beginning (after potential headers)
  const beginSample = buffer.slice(Math.min(8192, Math.floor(size * 0.1)), Math.min(16384, Math.floor(size * 0.2)));
  
  // Sample from middle
  const midStart = Math.floor(size * 0.4);
  const midEnd = Math.floor(size * 0.6);
  const midSample = buffer.slice(midStart, midEnd);
  
  // Sample from end (before potential footers)
  const endSample = buffer.slice(Math.max(0, size - 16384), Math.max(0, size - 8192));
  
  hash.update(beginSample);
  hash.update(midSample);
  hash.update(endSample);
  hash.update(Buffer.from(size.toString()));
  
  return hash.digest('hex');
}

/**
 * Enhanced comparison with multiple hash types for better duplicate detection
 */
export function compareFingerprints(
  fp1: VideoFingerprint, 
  fp2: VideoFingerprint,
  sizeTolerance: number = 0.02 // 2% size tolerance
): { isMatch: boolean; confidence: number; matchType: string } {
  // Exact SHA256 match = 100% confidence (identical files)
  if (fp1.sha256Hash && fp2.sha256Hash && fp1.sha256Hash === fp2.sha256Hash) {
    return { isMatch: true, confidence: 100, matchType: 'exact_sha256' };
  }
  
  // Primary hash match = 95% confidence (same content, possibly different metadata)
  if (fp1.hash === fp2.hash) {
    return { isMatch: true, confidence: 95, matchType: 'primary_hash' };
  }
  
  // Perceptual hash match = 85% confidence (same content, different encoding)
  if (fp1.perceptualHash && fp2.perceptualHash && fp1.perceptualHash === fp2.perceptualHash) {
    const sizeDiff = Math.abs(fp1.size - fp2.size) / Math.max(fp1.size, fp2.size);
    if (sizeDiff <= sizeTolerance * 2) { // Allow more tolerance for perceptual matches
      return { isMatch: true, confidence: 85, matchType: 'perceptual_hash' };
    }
  }
  
  // Content signature match = 75% confidence (similar content structure)
  if (fp1.contentSignature && fp2.contentSignature && fp1.contentSignature === fp2.contentSignature) {
    const sizeDiff = Math.abs(fp1.size - fp2.size) / Math.max(fp1.size, fp2.size);
    if (sizeDiff <= sizeTolerance * 3) { // More lenient for content signature
      return { isMatch: true, confidence: 75, matchType: 'content_signature' };
    }
  }
  
  // Size similarity check (potential re-encode with different settings)
  const sizeDiff = Math.abs(fp1.size - fp2.size) / Math.max(fp1.size, fp2.size);
  if (sizeDiff <= sizeTolerance) {
    // Similar size but different hashes - possible re-encode or slight modification
    const confidence = Math.max(0, 70 - (sizeDiff * 1000)); // Reduce confidence based on size difference
    return { 
      isMatch: confidence > 60, 
      confidence: Math.round(confidence),
      matchType: 'size_similarity'
    };
  }
  
  return { isMatch: false, confidence: 0, matchType: 'no_match' };
}

/**
 * Enhanced duplicate detection for Phase 1 with 20-day minimum repost prevention
 * NOTE: Only detects duplicates of videos that have been POSTED before
 * Unposted videos are allowed to have duplicates until they are actually posted
 */
export async function findDuplicateVideo(
  fingerprint: VideoFingerprint,
  VideoStatusModel: any,
  minDaysBeforeRepost: number = 20
): Promise<{ 
  isDuplicate: boolean; 
  lastPosted?: Date; 
  originalVideo?: any; 
  daysSinceLastPost?: number;
  matchType?: string;
  confidence?: number;
}> {
  
  // Check for exact SHA256 matches first (highest priority)
  if (fingerprint.sha256Hash) {
    const exactMatch = await VideoStatusModel.findOne({ 
      'fingerprint.sha256Hash': fingerprint.sha256Hash
    }).sort({ lastPosted: -1 });
    
    if (exactMatch) {
      const daysSince = exactMatch.lastPosted 
        ? Math.floor((Date.now() - exactMatch.lastPosted.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
        
      return {
        isDuplicate: daysSince < minDaysBeforeRepost,
        lastPosted: exactMatch.lastPosted,
        originalVideo: exactMatch,
        daysSinceLastPost: daysSince,
        matchType: 'exact_sha256',
        confidence: 100
      };
    }
  }

  // Check for primary hash matches
  const primaryMatch = await VideoStatusModel.findOne({ 
    'fingerprint.hash': fingerprint.hash
  }).sort({ lastPosted: -1 });
  
  if (primaryMatch) {
    const daysSince = primaryMatch.lastPosted 
      ? Math.floor((Date.now() - primaryMatch.lastPosted.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
      
    return {
      isDuplicate: daysSince < minDaysBeforeRepost,
      lastPosted: primaryMatch.lastPosted,
      originalVideo: primaryMatch,
      daysSinceLastPost: daysSince,
      matchType: 'primary_hash',
      confidence: 95
    };
  }

  // Check for perceptual hash matches
  if (fingerprint.perceptualHash) {
    const perceptualMatch = await VideoStatusModel.findOne({ 
      'fingerprint.perceptualHash': fingerprint.perceptualHash
    }).sort({ lastPosted: -1 });
    
    if (perceptualMatch) {
      const daysSince = perceptualMatch.lastPosted 
        ? Math.floor((Date.now() - perceptualMatch.lastPosted.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
        
      return {
        isDuplicate: daysSince < minDaysBeforeRepost,
        lastPosted: perceptualMatch.lastPosted,
        originalVideo: perceptualMatch,
        daysSinceLastPost: daysSince,
        matchType: 'perceptual_hash',
        confidence: 85
      };
    }
  }

  // Check for content signature matches
  if (fingerprint.contentSignature) {
    const contentMatch = await VideoStatusModel.findOne({ 
      'fingerprint.contentSignature': fingerprint.contentSignature
    }).sort({ lastPosted: -1 });
    
    if (contentMatch) {
      const daysSince = contentMatch.lastPosted 
        ? Math.floor((Date.now() - contentMatch.lastPosted.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
        
      return {
        isDuplicate: daysSince < minDaysBeforeRepost,
        lastPosted: contentMatch.lastPosted,
        originalVideo: contentMatch,
        daysSinceLastPost: daysSince,
        matchType: 'content_signature',
        confidence: 75
      };
    }
  }

  // Check for similar size videos (potential re-encodes) - more comprehensive
  const sizeTolerance = fingerprint.size * 0.05; // 5% tolerance for final check
  const similarVideos = await VideoStatusModel.find({
    'fingerprint.size': {
      $gte: fingerprint.size - sizeTolerance,
      $lte: fingerprint.size + sizeTolerance
    }
  }).sort({ lastPosted: -1 }).limit(10); // Limit for performance
  
  for (const video of similarVideos) {
    if (video.fingerprint) {
      const comparison = compareFingerprints(fingerprint, video.fingerprint);
      
      if (comparison.isMatch && comparison.confidence >= 60) {
        const daysSince = video.lastPosted 
          ? Math.floor((Date.now() - video.lastPosted.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
          
        return {
          isDuplicate: daysSince < minDaysBeforeRepost,
          lastPosted: video.lastPosted,
          originalVideo: video,
          daysSinceLastPost: daysSince,
          matchType: comparison.matchType,
          confidence: comparison.confidence
        };
      }
    }
  }
  
  return { isDuplicate: false };
} 

/**
 * Get repost cooldown settings from settings.json with Phase 1 defaults
 */
export function getRepostSettings(): { minDaysBeforeRepost: number } {
  const settingsPath = path.resolve(__dirname, '../../../settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return {
        minDaysBeforeRepost: settings.minDaysBeforeRepost || 20 // Phase 1 requirement: 20 days minimum
      };
    } catch (e) {
      console.error('Failed to read settings.json:', e);
    }
  }
  return { minDaysBeforeRepost: 20 }; // Phase 1 requirement: 20 days minimum
} 