import express from 'express';
import { VideoModel } from '../models/Video';

const router = express.Router();

router.get('/', async (req, res) => {
  const totalPosts = await VideoModel.countDocuments({ status: 'posted' });
  const all = await VideoModel.find({ status: 'posted' });

  const totalViews = all.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = all.reduce((sum, v) => sum + (v.likes || 0), 0);
  const platforms = {
    instagram: all.filter(v => v.platform === 'instagram').length,
    youtube: all.filter(v => v.platform === 'youtube').length,
  };

  res.json({ totalPosts, totalViews, totalLikes, platforms });
});

export default router;
