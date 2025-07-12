const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const instagramService = require('./instagramService');

class VideoMatchingService {
  constructor() {
    this.cache = new Map();
  }

  async generateVideoHash(videoPath) {
    try {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(videoPath);
        
        stream.on('data', (data) => {
          hash.update(data);
        });
        
        stream.on('end', () => {
          resolve(hash.digest('hex'));
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error generating video hash:', error);
      return null;
    }
  }

  async extractVideoMetadata(videoPath) {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }
          
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            width: videoStream?.width,
            height: videoStream?.height,
            codec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name,
            frameRate: videoStream?.r_frame_rate,
            creationTime: metadata.format.tags?.creation_time
          });
        });
      });
    } catch (error) {
      console.error('Error extracting video metadata:', error);
      return null;
    }
  }

  async checkVideoExistsOnInstagram(videoPath) {
    try {
      // Generate video hash for comparison
      const videoHash = await this.generateVideoHash(videoPath);
      const metadata = await this.extractVideoMetadata(videoPath);
      
      if (!videoHash) {
        console.warn('Could not generate video hash for comparison');
        return { exists: false, existingCaption: null, postId: null };
      }
      
      // Check cache first
      if (this.cache.has(videoHash)) {
        const cached = this.cache.get(videoHash);
        console.log(`📱 Found cached Instagram match for video hash: ${videoHash}`);
        return cached;
      }
      
      // Check Instagram for existing posts
      const instagramCheck = await instagramService.checkVideoExists(videoPath);
      
      if (instagramCheck.exists && instagramCheck.postId) {
        // Extract caption from existing post
        const existingCaption = await instagramService.extractCaptionFromExistingPost(instagramCheck.postId);
        
        const result = {
          exists: true,
          existingCaption: existingCaption,
          postId: instagramCheck.postId,
          videoHash: videoHash,
          metadata: metadata
        };
        
        // Cache the result
        this.cache.set(videoHash, result);
        
        console.log(`📱 Found existing Instagram post for video: ${path.basename(videoPath)}`);
        console.log(`📋 Caption: "${existingCaption?.substring(0, 100)}..."`);
        
        return result;
      }
      
      // No match found
      const result = {
        exists: false,
        existingCaption: null,
        postId: null,
        videoHash: videoHash,
        metadata: metadata
      };
      
      // Cache the result
      this.cache.set(videoHash, result);
      
      return result;
    } catch (error) {
      console.error('Error checking video existence on Instagram:', error);
      return { exists: false, existingCaption: null, postId: null };
    }
  }

  async findSimilarVideos(videoPath, threshold = 0.8) {
    try {
      const currentMetadata = await this.extractVideoMetadata(videoPath);
      if (!currentMetadata) return [];
      
      // This is a simplified similarity check
      // In a production system, you might use more sophisticated video fingerprinting
      const similarVideos = [];
      
      // Check against cached videos
      for (const [hash, cachedData] of this.cache.entries()) {
        if (cachedData.metadata) {
          const similarity = this.calculateSimilarity(currentMetadata, cachedData.metadata);
          if (similarity >= threshold) {
            similarVideos.push({
              hash: hash,
              similarity: similarity,
              metadata: cachedData.metadata,
              existingCaption: cachedData.existingCaption
            });
          }
        }
      }
      
      return similarVideos.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Error finding similar videos:', error);
      return [];
    }
  }

  calculateSimilarity(metadata1, metadata2) {
    let similarity = 0;
    let factors = 0;
    
    // Compare duration (within 5 seconds)
    if (metadata1.duration && metadata2.duration) {
      const durationDiff = Math.abs(metadata1.duration - metadata2.duration);
      const durationSimilarity = Math.max(0, 1 - (durationDiff / 5));
      similarity += durationSimilarity;
      factors++;
    }
    
    // Compare resolution
    if (metadata1.width && metadata2.width && metadata1.height && metadata2.height) {
      const res1 = metadata1.width * metadata1.height;
      const res2 = metadata2.width * metadata2.height;
      const resSimilarity = Math.min(res1, res2) / Math.max(res1, res2);
      similarity += resSimilarity;
      factors++;
    }
    
    // Compare file size (within 10% difference)
    if (metadata1.size && metadata2.size) {
      const sizeDiff = Math.abs(metadata1.size - metadata2.size);
      const avgSize = (metadata1.size + metadata2.size) / 2;
      const sizeSimilarity = Math.max(0, 1 - (sizeDiff / avgSize));
      similarity += sizeSimilarity;
      factors++;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }

  async getOptimizedContentForVideo(videoPath, videoData) {
    try {
      // Check if video exists on Instagram
      const instagramCheck = await this.checkVideoExistsOnInstagram(videoPath);
      
      if (instagramCheck.exists && instagramCheck.existingCaption) {
        console.log(`📱 Using existing Instagram caption for: ${path.basename(videoPath)}`);
        
        // Generate new viral hashtags for the existing caption
        const viralHashtags = await instagramService.generateViralHashtags(videoData, instagramCheck.existingCaption);
        
        return {
          caption: instagramCheck.existingCaption,
          hashtags: viralHashtags,
          source: 'existing_instagram',
          postId: instagramCheck.postId
        };
      }
      
      // No existing post found, generate new content
      console.log(`🆕 Generating new content for: ${path.basename(videoPath)}`);
      
      const optimizedContent = await instagramService.createOptimizedCaption(videoData);
      
      return {
        caption: optimizedContent.caption,
        hashtags: optimizedContent.hashtags,
        source: 'ai_generated',
        postId: null
      };
    } catch (error) {
      console.error('Error getting optimized content for video:', error);
      
      // Fallback content
      return {
        caption: "🏠 Dream home alert! This could be your next investment. Perfect timing for buyers in today's market. DM for details!",
        hashtags: ['#RealEstate', '#HomeBuying', '#Investment', '#DreamHome', '#BuyNow'],
        source: 'fallback',
        postId: null
      };
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Video matching cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = new VideoMatchingService(); 