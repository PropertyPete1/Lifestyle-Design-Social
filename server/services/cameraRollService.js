const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const aiService = require('./aiService');
const Video = require('../models/Video');

class CameraRollService {
  constructor() {
    this.supportedFormats = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
    this.cameraRollPath = process.env.CAMERA_ROLL_PATH || '/Users/peterallen/Pictures/Camera Roll';
  }

  async scanCameraRoll() {
    try {
      console.log('📱 Scanning camera roll for videos with audio...');
      
      const videos = [];
      const files = await this.getVideoFiles(this.cameraRollPath);
      
      for (const file of files) {
        const hasAudio = await this.checkVideoAudio(file);
        if (hasAudio) {
          const videoInfo = await this.analyzeVideo(file);
          videos.push(videoInfo);
        }
      }
      
      console.log(`✅ Found ${videos.length} videos with audio`);
      return videos;
    } catch (error) {
      console.error('Error scanning camera roll:', error);
      throw error;
    }
  }

  async getVideoFiles(directory) {
    const files = [];
    
    const readDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          readDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    readDir(directory);
    return files;
  }

  async checkVideoAudio(filePath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.warn(`Could not analyze ${filePath}:`, err.message);
          resolve(false);
          return;
        }
        
        const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
        resolve(hasAudio);
      });
    });
  }

  // Detect location from filename (expanded for suburbs)
  detectLocationFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    // Austin and suburbs
    const austinTerms = [
      'austin', 'leander', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'hutto', 'manor', 'bee cave', 'lakeway', 'dripping springs', 'buda', 'kyle', 'west lake', 'westlake', 'jonestown', 'lagovista', 'laguna vista', 'sunset valley', 'wells branch', 'brushy creek', 'hudson bend', 'del valle', 'anderson mill', 'jollyville', 'tarrytown', 'oak hill', 'steiner ranch', 'four points', 'barton creek', 'rollingwood', 'lost creek', 'shady hollow', 'wimberley', 'spicewood', 'volente', 'point venture'
    ];
    // San Antonio and suburbs
    const saTerms = [
      'san antonio', 'alamo ranch', 'stone oak', 'schertz', 'converse', 'helotes', 'alamo heights', 'universal city', 'live oak', 'selma', 'cibolo', 'new braunfels', 'boerne', 'castroville', 'shavano park', 'windcrest', 'bulverde', 'terrell hills', 'hollywood park', 'olmos park', 'timberwood park', 'fair oaks', 'fair oaks ranch', 'garden ridge', 'balcones heights', 'leon valley', 'china grove', 'kirby', 'castle hills', 'grey forest', 'hill country village', 'cross mountain', 'macdona', 'somerset', 'von ormy', 'atascosa', 'adkins', 'lacoste', 'lytle', 'st hedwig', 'st. hedwig', 'elmendorf', 'sandy oaks', 'losoya', 'bigfoot', 'pipe creek', 'lakehills', 'medina lake', 'pleasanton', 'devine', 'floresville', 'poteet', 'jourdanton', 'poth', 'la vernia', 'seguin', 'marion', 'mcqueeney', 'spring branch', 'bulverde', 'garden ridge', 'selma', 'canyon lake', 'universal city', 'live oak', 'randolph afb', 'randolph', 'fort sam', 'fort sam houston', 'lackland', 'lackland afb', 'jbsa', 'jbsa lackland', 'jbsa randolph', 'jbsa fort sam', 'jbsa sam houston'
    ];
    
    for (const term of austinTerms) {
      if (lowerFilename.includes(term)) return 'austin';
    }
    for (const term of saTerms) {
      if (lowerFilename.includes(term)) return 'sanAntonio';
    }
    // Default
    return 'sanAntonio';
  }

  async analyzeVideo(filePath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          resolve({
            path: filePath,
            name: path.basename(filePath),
            duration: 0,
            size: fs.statSync(filePath).size,
            hasAudio: false,
            error: err.message,
            location: this.detectLocationFromFilename(path.basename(filePath))
          });
          return;
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        resolve({
          path: filePath,
          name: path.basename(filePath),
          duration: metadata.format.duration || 0,
          size: metadata.format.size || fs.statSync(filePath).size,
          hasAudio: !!audioStream,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          bitrate: metadata.format.bit_rate || 0,
          format: metadata.format.format_name || path.extname(filePath),
          location: this.detectLocationFromFilename(path.basename(filePath))
        });
      });
    });
  }

  async aiSelectBestVideos(videos, targetCount = 3) {
    try {
      console.log('🤖 AI selecting best videos for buyer audience...');
      
      // Filter videos by quality criteria
      const qualityVideos = videos.filter(video => 
        video.duration >= 15 && // At least 15 seconds
        video.duration <= 300 && // No longer than 5 minutes
        video.hasAudio &&
        video.size <= 100 * 1024 * 1024 && // Under 100MB
        video.width >= 720 // At least 720p
      );
      
      if (qualityVideos.length === 0) {
        throw new Error('No videos meet quality criteria');
      }
      
      // AI analyze each video for buyer appeal
      const analyzedVideos = await Promise.all(
        qualityVideos.map(async (video) => {
          const aiScore = await this.aiAnalyzeVideoAppeal(video);
          return { ...video, aiScore };
        })
      );
      
      // Sort by AI score and select top videos
      const selectedVideos = analyzedVideos
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, targetCount);
      
      console.log(`✅ AI selected ${selectedVideos.length} videos for posting`);
      return selectedVideos;
    } catch (error) {
      console.error('Error in AI video selection:', error);
      throw error;
    }
  }

  async aiAnalyzeVideoAppeal(video) {
    try {
      // Generate a prompt for AI to analyze video appeal
      const prompt = `Analyze this real estate video for buyer appeal and viral potential:

Video Details:
- Duration: ${video.duration} seconds
- Resolution: ${video.width}x${video.height}
- File size: ${(video.size / 1024 / 1024).toFixed(2)} MB
- Has audio: ${video.hasAudio}
- Format: ${video.format}

Rate this video from 1-10 for:
1. Buyer engagement potential (people looking to buy homes in 30-90 days)
2. Viral sharing potential
3. Professional quality
4. Market timing relevance

Consider:
- Video length (15-60 seconds is optimal for social media)
- Quality and resolution
- Audio presence (crucial for engagement)
- File size (affects upload success)

Return only a number between 1-10 representing the overall score.`;

      const response = await aiService.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate marketing analyst who evaluates video content for buyer engagement and viral potential.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      });

      const score = parseFloat(response.choices[0].message.content.trim()) || 5;
      return score;
    } catch (error) {
      console.error('Error analyzing video appeal:', error);
      return 5; // Default score
    }
  }

  async copyVideoToUploads(videoPath, userId) {
    try {
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      const fileName = path.basename(videoPath);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const newFileName = `camera-roll-${uniqueSuffix}-${fileName}`;
      const newPath = path.join(uploadPath, newFileName);
      
      // Copy file
      fs.copyFileSync(videoPath, newPath);
      
      return {
        originalPath: videoPath,
        newPath: newPath,
        fileName: newFileName
      };
    } catch (error) {
      console.error('Error copying video:', error);
      throw error;
    }
  }

  async createVideoRecord(videoInfo, userId) {
    try {
      // Use the enhanced video matching service
      const videoMatchingService = require('./videoMatchingService');
      let existingCaption = null;
      let captionSource = 'ai_generated';
      let postId = null;
      
      try {
        const videoData = {
          title: videoInfo.name,
          description: 'Camera roll video',
          category: 'residential',
          propertyType: 'house'
        };
        
        const optimizedContent = await videoMatchingService.getOptimizedContentForVideo(
          videoInfo.originalPath, 
          videoData
        );
        
        existingCaption = optimizedContent.caption;
        captionSource = optimizedContent.source;
        postId = optimizedContent.postId;
        
        if (captionSource === 'existing_instagram') {
          console.log(`📱 Found existing Instagram caption for: ${videoInfo.name}`);
        } else {
          console.log(`🆕 Generated new content for: ${videoInfo.name}`);
        }
      } catch (error) {
        console.warn('Could not check Instagram for existing post:', error.message);
      }
      
      const video = new Video({
        user: userId,
        title: `Camera Roll Video - ${videoInfo.name}`,
        description: 'Auto-selected from camera roll for buyer audience',
        filePath: videoInfo.newPath,
        fileName: videoInfo.fileName,
        fileSize: videoInfo.size,
        category: 'residential',
        tags: ['camera-roll', 'auto-selected', 'buyer-focused'],
        status: 'ready',
        processingProgress: 100,
        metadata: {
          originalPath: videoInfo.originalPath,
          duration: videoInfo.duration,
          resolution: `${videoInfo.width}x${videoInfo.height}`,
          aiScore: videoInfo.aiScore,
          existingCaption: existingCaption,
          captionSource: captionSource,
          instagramPostId: postId
        }
      });
      
      await video.save();
      return video;
    } catch (error) {
      console.error('Error creating video record:', error);
      throw error;
    }
  }

  async autoSelectAndPrepareVideos(userId, targetCount = 3) {
    try {
      console.log('🚀 Starting auto video selection process...');
      
      // Scan camera roll
      const allVideos = await this.scanCameraRoll();
      
      // AI select best videos
      const selectedVideos = await this.aiSelectBestVideos(allVideos, targetCount);
      
      // Copy videos to uploads and create records
      const videoRecords = [];
      for (const video of selectedVideos) {
        const copiedVideo = await this.copyVideoToUploads(video.path, userId);
        const videoRecord = await this.createVideoRecord({
          ...video,
          newPath: copiedVideo.newPath,
          fileName: copiedVideo.fileName
        }, userId);
        
        videoRecords.push(videoRecord);
      }
      
      console.log(`✅ Prepared ${videoRecords.length} videos for auto-posting`);
      return videoRecords;
    } catch (error) {
      console.error('Error in auto video selection:', error);
      throw error;
    }
  }
}

module.exports = new CameraRollService(); 