import express from 'express';
import { VideoModel } from '../models/Video';

const router = express.Router();

router.get('/', async (req, res) => {
  const drafts = await VideoModel.find({ status: 'draft' }).sort({ createdAt: -1 });
  res.json(drafts);
});

router.get('/:id', async (req, res) => {
  const draft = await VideoModel.findById(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Not found' });
  res.json(draft);
});

router.put('/:id', async (req, res) => {
  const { caption } = req.body;
  const updated = await VideoModel.findByIdAndUpdate(
    req.params.id,
    { caption },
    { new: true }
  );
  res.json(updated);
});

export default router; 