import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { videoIntelligenceService } from '../services/videoIntelligenceService';
import { thumbnailSelectionService } from '../services/thumbnailSelectionService';
import { trendingMusicService } from '../services/trendingMusicService';
import { audioMoodMatchingService } from '../services/audioMoodMatchingService';
import { videoCompressionService } from '../services/videoCompressionService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Using singleton service instances

/**
 * POST /api/video-intelligence/analyze
 * Comprehensive video analysis with AI intelligence
 */
router.post('/analyze', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { contentType = 'real_estate', platforms = ['instagram'] } = req.body;
    const videoPath = req.file.path;
    const videoId = req.file.filename.replace(path.extname(req.file.filename), '');

    logger.info(`Starting comprehensive video analysis for: ${videoId}`);

    // Run all analyses in parallel for efficiency
    const [
      videoAnalysis,
      thumbnailSelection,
      audioMoodAnalysis,
      compressionRecommendations
    ] = await Promise.all([
      videoIntelligenceService.analyzeVideo(videoId, videoPath),
      thumbnailSelectionService.selectBestThumbnail(videoId, videoPath),
      audioMoodMatchingService.analyzeAndMatchAudio(videoId, videoPath),
      videoCompressionService.getCompressionRecommendations(
        videoPath,
        platforms[0] || 'instagram',
        contentType
      )
    ]);

    // Get music recommendations based on audio analysis
    const musicRecommendations = await trendingMusicService.getMusicRecommendations({
      videoId,
      videoMood: audioMoodAnalysis.detectedMood,
      contentType,
      audioDuration: audioMoodAnalysis.audioFeatures.volume > 0 ? 60000 : 0,
      audioTempo: audioMoodAnalysis.audioFeatures.tempo,
      audioEnergy: audioMoodAnalysis.audioFeatures.energy,
      targetPlatforms: platforms,
      excludeExplicit: true
    });

    const response = {
      videoId,
      analysis: {
        scene: [], // Scene analysis data will be added when feature is implemented
        audio: audioMoodAnalysis,
        engagement: videoAnalysis.engagementPrediction,
        optimization: videoAnalysis.optimizationSuggestions
      },
      recommendations: {
        thumbnail: {
          best: thumbnailSelection.selectedThumbnail,
          alternatives: thumbnailSelection.alternatives,
          reasoning: thumbnailSelection.selectionReasoning,
          processingTime: thumbnailSelection.processingTime
        },
        music: musicRecommendations.slice(0, 5), // Top 5 recommendations
        compression: compressionRecommendations.recommendations,
        mixing: audioMoodAnalysis.mixingStrategy
      },
      warnings: [
        ...compressionRecommendations.warnings,
        ...videoAnalysis.optimizationSuggestions
          .filter(s => s.impact === 'high')
          .map(s => s.suggestion)
      ],
      processingTime: Date.now() - Date.now() // This would be calculated properly
    };

    return res.json(response);

  } catch (error) {
    logger.error('Video analysis error:', error);
    return res.status(500).json({ 
      error: 'Video analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/video-intelligence/thumbnails/:videoId
 * Get thumbnail options for a video
 */
router.get('/thumbnails/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    const thumbnails = await thumbnailSelectionService.getThumbnailCandidates(videoId);
    const selected = await thumbnailSelectionService.getSelectedThumbnail(videoId);

    return res.json({
      selected,
      candidates: thumbnails,
      totalCandidates: thumbnails.length
    });

  } catch (error) {
    logger.error('Error getting thumbnails:', error);
    return res.status(500).json({ error: 'Failed to get thumbnails' });
  }
});

/**
 * POST /api/video-intelligence/thumbnails/:videoId/select
 * Select a different thumbnail for a video
 */
router.post('/thumbnails/:videoId/select', authenticateToken, async (req, res) => {
  try {
    const { videoId: _videoId } = req.params;
    const { thumbnailId } = req.body;

    if (!thumbnailId) {
      return res.status(400).json({ error: 'Thumbnail ID is required' });
    }

    // This would update the selection in the database
    // For now, just return success
    return res.json({
      success: true,
      message: 'Thumbnail selection updated',
      selectedThumbnail: thumbnailId
    });

  } catch (error) {
    logger.error('Error selecting thumbnail:', error);
    return res.status(500).json({ error: 'Failed to select thumbnail' });
  }
});

/**
 * GET /api/video-intelligence/music/:videoId
 * Get music recommendations for a video
 */
router.get('/music/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { platform = 'instagram', contentType = 'real_estate' } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const storedRecommendations = await trendingMusicService.getStoredRecommendations(videoId);
    
    if (storedRecommendations.length === 0) {
      return res.status(404).json({ 
        error: 'No music recommendations found',
        message: 'Please analyze the video first'
      });
    }

    return res.json({
      recommendations: storedRecommendations,
      totalRecommendations: storedRecommendations.length,
      platform,
      contentType
    });

  } catch (error) {
    logger.error('Error getting music recommendations:', error);
    return res.status(500).json({ error: 'Failed to get music recommendations' });
  }
});

/**
 * GET /api/video-intelligence/trending-music
 * Get current trending music across platforms
 */
router.get('/trending-music', authenticateToken, async (req, res) => {
  try {
    const { platform = 'all', genre, mood, limit: _limit = 20 } = req.query;

    // This would get trending music from the service
    // For now, return mock data
    const trendingMusic = [
      {
        id: 'trending_1',
        name: 'Viral Real Estate Beat',
        artist: 'Property Music',
        platform: 'spotify',
        trendingScore: 0.95,
        genre: 'ambient',
        mood: 'professional'
      },
      {
        id: 'trending_2',
        name: 'Luxury Showcase',
        artist: 'Real Estate Sounds',
        platform: 'tiktok',
        trendingScore: 0.92,
        genre: 'cinematic',
        mood: 'inspiring'
      }
    ];

    return res.json({
      trending: trendingMusic,
      filters: { platform, genre, mood },
      totalTracks: trendingMusic.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting trending music:', error);
    return res.status(500).json({ error: 'Failed to get trending music' });
  }
});

/**
 * POST /api/video-intelligence/compress
 * Compress video with intelligent optimization
 */
router.post('/compress', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const {
      platform = 'instagram',
      contentType = 'real_estate',
      quality = 'high',
      targetFileSize,
      preserveAudio = true,
      enhanceVisuals = false,
      optimizeForMobile = true
    } = req.body;

    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '_compressed' + path.extname(inputPath));

    const settings = {
      platform,
      contentType,
      quality,
      targetFileSize: targetFileSize ? parseInt(targetFileSize) : undefined,
      preserveAudio: preserveAudio === 'true',
      enhanceVisuals: enhanceVisuals === 'true',
      optimizeForMobile: optimizeForMobile === 'true'
    };

    const compressionResult = await videoCompressionService.compressVideo(
      inputPath,
      outputPath,
      settings
    );

    if (compressionResult.success) {
      return res.json({
        success: true,
        result: compressionResult,
        downloadUrl: `/api/video-intelligence/download/${path.basename(outputPath)}`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Compression failed',
        warnings: compressionResult.warnings
      });
    }

  } catch (error) {
    logger.error('Video compression error:', error);
    return res.status(500).json({ 
      error: 'Video compression failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/video-intelligence/download/:filename
 * Download processed video file
 */
router.get('/download/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(__dirname, '../../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
      // Callback doesn't need explicit return
    });
    return; // Explicitly return after download

  } catch (error) {
    logger.error('Download error:', error);
    return res.status(500).json({ error: 'Download failed' });
  }
});

/**
 * GET /api/video-intelligence/audio-analysis/:videoId
 * Get detailed audio analysis for a video
 */
router.get('/audio-analysis/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    const audioAnalysis = await audioMoodMatchingService.getStoredAudioAnalysis(videoId);
    
    if (!audioAnalysis || audioAnalysis.length === 0) {
      return res.status(404).json({ 
        error: 'No audio analysis found',
        message: 'Please analyze the video first'
      });
    }

    // Get the most recent analysis
    const latestAnalysis = audioAnalysis[0];

    return res.json({
      analysis: latestAnalysis,
      recommendations: {
        music: latestAnalysis.recommendations?.suggestedMusicGenres || [],
        soundEffects: [], // Not implemented in current analysis
        mixing: latestAnalysis.recommendations?.energyLevel || 'medium'
      }
    });

  } catch (error) {
    logger.error('Error getting audio analysis:', error);
    return res.status(500).json({ error: 'Failed to get audio analysis' });
  }
});

/**
 * GET /api/video-intelligence/optimization-suggestions/:videoId
 * Get optimization suggestions for a video
 */
router.get('/optimization-suggestions/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // This would get stored optimization suggestions
    // For now, return mock data
    const suggestions = [
      {
        category: 'thumbnail',
        suggestion: 'Use thumbnail with better composition and brighter colors',
        impact: 'high',
        effort: 'easy',
        estimatedImprovement: 15
      },
      {
        category: 'audio',
        suggestion: 'Add background music to enhance engagement',
        impact: 'high',
        effort: 'moderate',
        estimatedImprovement: 25
      },
      {
        category: 'compression',
        suggestion: 'Optimize compression settings for better quality',
        impact: 'medium',
        effort: 'easy',
        estimatedImprovement: 10
      }
    ];

    return res.json({
      videoId,
      suggestions,
      totalSuggestions: suggestions.length,
      highImpactSuggestions: suggestions.filter(s => s.impact === 'high').length
    });

  } catch (error) {
    logger.error('Error getting optimization suggestions:', error);
    return res.status(500).json({ error: 'Failed to get optimization suggestions' });
  }
});

/**
 * DELETE /api/video-intelligence/cleanup/:videoId
 * Clean up temporary files for a video
 */
router.delete('/cleanup/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Clean up temporary files
    const uploadDir = path.join(__dirname, '../../../uploads');
    const files = fs.readdirSync(uploadDir);
    
    let deletedFiles = 0;
    
    files.forEach(file => {
      if (file.includes(videoId)) {
        const filePath = path.join(uploadDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedFiles++;
        } catch (error) {
          logger.warn(`Failed to delete file: ${file}`);
        }
      }
    });

    return res.json({
      success: true,
      message: `Cleaned up ${deletedFiles} files for video ${videoId}`,
      deletedFiles
    });

  } catch (error) {
    logger.error('Cleanup error:', error);
    return res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router; 