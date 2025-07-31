import express from 'express'
import { MongoClient } from 'mongodb'
import { autopilotService } from '../../services/autopilotService'

const router = express.Router()
const MONGODB_URI = process.env.MONGODB_URI!

router.get('/queue', async (req, res) => {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db()
  const queue = db.collection('smart_autopilot_queue')
  const items = await queue.find({}).sort({ createdAt: -1 }).limit(10).toArray()
  await client.close()
  res.json(items)
})

// Manual trigger for autopilot
router.post('/trigger', async (req, res) => {
  try {
    console.log('🔄 Manual autopilot trigger requested...')
    
    // Run autopilot service directly
    const result = await autopilotService.runAutopilot()
    
    console.log('✅ Manual autopilot completed')
    res.json({ 
      success: true, 
      message: 'Autopilot completed successfully',
      data: result
    })
    
  } catch (error) {
    console.error('❌ Manual trigger error:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger autopilot'
    })
  }
})

export default router