import { Router } from 'express';
import { getPrompts, savePrompt, deletePrompt } from '../lib/cartoon/promptStorage';
import { generateCartoonVideo } from '../lib/cartoon/generateCartoonVideo';

const router = Router();

// GET /api/cartoon/prompts - Get all prompts
router.get('/prompts', async (req, res) => {
  try {
    const prompts = await getPrompts();
    res.status(200).json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// POST /api/cartoon/prompts - Add new prompt
router.post('/prompts', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const prompts = await savePrompt(prompt);
    res.status(200).json({ prompts });
  } catch (error) {
    console.error('Error saving prompt:', error);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

// DELETE /api/cartoon/prompts - Delete prompt
router.delete('/prompts', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const prompts = await deletePrompt(prompt);
    res.status(200).json({ prompts });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// POST /api/cartoon/generate - Generate cartoon video
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    // Validate prompt length
    if (prompt.length > 500) {
      return res.status(400).json({ error: 'Prompt too long (max 500 characters)' });
    }

    // Fake generation for now - simulate processing time
    console.log(`Cartoon generation started with prompt: ${prompt}`);
    
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response with mock data
    res.status(200).json({
      status: 'processing',
      message: 'Cartoon generation started successfully',
      prompt: prompt.trim(),
      videoUrl: null, // Will be populated when generation completes
      estimatedTime: '2-3 minutes',
      generationId: `cartoon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

  } catch (error) {
    console.error('Cartoon generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error during cartoon generation',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// GET /api/cartoon/queue - Get cartoon generation queue
router.get('/queue', async (req, res) => {
  try {
    // Mock data for queue tracking
    const mockQueue = [
      {
        id: 'cartoon_1',
        prompt: 'Modern kitchen in cartoon world',
        status: 'processing',
        progress: 65,
        estimatedTime: '2-3 minutes',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cartoon_2',
        prompt: 'Street-style real estate video with color pop',
        status: 'queued',
        createdAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'cartoon_3',
        prompt: 'Create a cartoon showing a beautiful house',
        status: 'completed',
        createdAt: new Date(Date.now() - 600000).toISOString()
      }
    ];

    res.status(200).json({
      status: 'in_progress',
      items: mockQueue,
      totalJobs: mockQueue.length,
      processingJobs: mockQueue.filter(job => job.status === 'processing').length,
      queuedJobs: mockQueue.filter(job => job.status === 'queued').length,
      completedJobs: mockQueue.filter(job => job.status === 'completed').length
    });

  } catch (error) {
    console.error('Queue API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router; 