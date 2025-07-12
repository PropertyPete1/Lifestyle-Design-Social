import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { CaptionGenerationService } from '../services/captionGenerationService';
import { VideoModel } from '../models/Video';

const router = Router();
const captionService = new CaptionGenerationService();
const videoModel = new VideoModel();

// Remove the duplicate authenticateToken definition since we're importing it

router.post('/generate', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { videoId, platform, style, includeHashtags, customPrompt } = req.body;
    
    if (!videoId) {
      res.status(400).json({ error: 'Video ID is required' });
      return;
    }
    
    const video = await videoModel.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }
    
    const caption = await captionService.generateCaption({
      videoId,
      userId,
      platform: platform || 'instagram',
      style: style || 'professional',
      includeHashtags: includeHashtags !== false,
      customPrompt
    });
    
    res.json({
      caption: caption.text,
      hashtags: caption.hashtags,
      style: caption.style,
      confidence: caption.confidence,
      suggestions: caption.suggestions
    });
    return;
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ error: 'Failed to generate caption' });
    return;
  }
});

router.post('/generate-batch', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { videoIds, platform, style, includeHashtags } = req.body;
    
    if (!videoIds || !Array.isArray(videoIds)) {
      res.status(400).json({ error: 'Video IDs array is required' });
      return;
    }
    
    const captions = await Promise.all(
      videoIds.map(async (videoId: string) => {
        try {
          const caption = await captionService.generateCaption({
            videoId,
            userId,
            platform: platform || 'instagram',
            style: style || 'professional',
            includeHashtags: includeHashtags !== false
          });
          
          return {
            videoId,
            success: true,
            caption: caption.text,
            hashtags: caption.hashtags,
            style: caption.style,
            confidence: caption.confidence
          };
        } catch (error) {
          return {
            videoId,
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate caption'
          };
        }
      })
    );
    
    res.json({
      captions,
      total: videoIds.length,
      successful: captions.filter(c => c.success).length,
      failed: captions.filter(c => !c.success).length
    });
    return;
  } catch (error) {
    console.error('Batch caption generation error:', error);
    res.status(500).json({ error: 'Failed to generate batch captions' });
    return;
  }
});

export default router; 