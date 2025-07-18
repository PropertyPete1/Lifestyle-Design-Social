import express from 'express';

const router = express.Router();

router.post('/train', async (req, res) => {
  try {
    const { captions } = req.body;
    if (!captions || typeof captions !== 'string') {
      return res.status(400).json({ error: 'No captions provided' });
    }

    // In real version, you'd call OpenAI or fine-tune logic here.
    console.log('[TRAINING INPUT]', captions);

    res.json({ message: 'Training complete! Style learned ✅' });
  } catch (err) {
    console.error('[TRAIN ERROR]', err);
    res.status(500).json({ error: 'Training failed' });
  }
});

export default router;
