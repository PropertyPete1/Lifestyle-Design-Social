import { Router } from 'express';
import { getTopHashtags } from '../lib/hashtags/getTopHashtags';

const router = Router();

// Get top performing hashtags
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const hashtags = await getTopHashtags(limit);
    
    res.status(200).json({ 
      success: true, 
      hashtags,
      count: hashtags.length 
    });
  } catch (error) {
    console.error('Failed to get top hashtags:', error);
    res.status(500).json({ error: 'Failed to fetch top hashtags' });
  }
});

export default router; 