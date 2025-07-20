import { Router } from 'express';
import { mimicCaption } from '../lib/captions/mimicCaption';
import { mimicSuccessfulCaption } from '../lib/captions/captionMimicry';
import { syncInstagramCaptions } from '../webhooks/syncInstagramPosts';
import { getBestCaptions } from '../lib/api/handlers/getBestCaptions';
import { getTopCaptions, saveCaptions } from '../lib/db/captionStorage';
import { gptMimicCaption } from '../lib/ai/gptCaptionMimic';
import { rewriteCaptionWithStyle } from '../lib/captions/gptCaptionRewriter';
import { replaceHashtags } from '../lib/hashtags/replaceHashtags';
import { enhanceCaptionWithGPT } from '../lib/captions/gptCaptionEnhancer';
import { scrapeRecentCaptions } from '../lib/instagram/scrapeCaptions';
import { enhanceUsingMemory } from '../lib/captions/gptWithMemory';
import { replaceWeakHashtags } from '../lib/hashtags/replaceWeakHashtags';

const router = Router();

router.get('/best', async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    const captions = await getBestCaptions();
    res.status(200).json({ captions });
  } catch (err) {
    console.error('Get captions failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/mimic', async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid topic' });
  }

  try {
    const caption = await mimicCaption(topic);
    res.status(200).json({ caption });
  } catch (err) {
    console.error('Error generating caption:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mimic-enhance', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { baseCaption } = req.body;

  if (!baseCaption) return res.status(400).json({ error: 'Missing baseCaption' });

  try {
    const newCaption = await mimicSuccessfulCaption(baseCaption);
    res.status(200).json({ caption: newCaption });
  } catch (err) {
    console.error('Caption mimicry failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    await syncInstagramCaptions();
    res.status(200).json({ status: 'Synced' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to sync' });
  }
});

router.post('/mimic-gpt', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { baseCaption } = req.body;
  if (!baseCaption) return res.status(400).json({ error: 'Missing baseCaption' });

  try {
    const topCaptions = await getTopCaptions();
    const generated = await gptMimicCaption(baseCaption, topCaptions);
    res.status(200).json({ caption: generated });
  } catch (err) {
    console.error('Caption mimic failed:', err);
    res.status(500).json({ error: 'Mimic error' });
  }
});

router.post('/rewrite', async (req, res) => {
  const { baseCaption } = req.body;
  
  if (!baseCaption) {
    return res.status(400).json({ error: 'Missing baseCaption' });
  }

  try {
    const rewritten = await rewriteCaptionWithStyle(baseCaption);
    return res.status(200).json({ rewritten });
  } catch (error) {
    console.error('Caption rewrite error:', error);
    return res.status(500).json({ error: 'Failed to rewrite caption' });
  }
});

router.post('/fullEnhance', async (req, res) => {
  const { baseCaption } = req.body;
  
  if (!baseCaption) {
    return res.status(400).json({ error: 'Missing baseCaption' });
  }

  try {
    const rewritten = await rewriteCaptionWithStyle(baseCaption);
    const final = await replaceHashtags(rewritten);
    return res.status(200).json({ final });
  } catch (error) {
    console.error('Full enhance error:', error);
    return res.status(500).json({ error: 'Failed to enhance caption' });
  }
});

router.post('/gpt-enhance', async (req, res) => {
  const { caption } = req.body;

  if (!caption) {
    return res.status(400).json({ error: 'No caption provided' });
  }

  try {
    const result = await enhanceCaptionWithGPT(caption);
    return res.status(200).json({ enhanced: result });
  } catch (error) {
    console.error('GPT enhance error:', error);
    return res.status(500).json({ error: 'Failed to enhance caption' });
  }
});

router.post('/scrape', async (req, res) => {
  try {
    const captions = await scrapeRecentCaptions();
    await saveCaptions(captions);
    res.status(200).json({ success: true, count: captions.length });
  } catch (err) {
    console.error('Caption scrape error:', err);
    res.status(500).json({ success: false, error: 'Failed to scrape captions.' });
  }
});

router.post('/gpt-memory', async (req, res) => {
  const { caption } = req.body;

  if (!caption) {
    return res.status(400).json({ error: 'Missing caption' });
  }

  try {
    const enhanced = await enhanceUsingMemory(caption);
    res.status(200).json({ enhanced });
  } catch (err) {
    console.error('Memory-based caption error:', err);
    res.status(500).json({ error: 'Memory enhancement failed' });
  }
});

// Add auto-replace weak hashtags route
router.post('/auto-replace', async (req, res) => {
  const { caption } = req.body;
  
  if (!caption) {
    return res.status(400).json({ error: 'Missing caption' });
  }

  try {
    const result = await replaceWeakHashtags(caption);
    res.status(200).json({ updatedCaption: result });
  } catch (error) {
    console.error('Auto-replace error:', error);
    res.status(500).json({ error: 'Failed to replace weak hashtags' });
  }
});

// Add test route to check MongoDB memory
router.get('/test', async (req, res) => {
  try {
    const captions = await getTopCaptions(10);
    res.status(200).json({ captions });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: 'Failed to fetch captions' });
  }
});

export default router; 