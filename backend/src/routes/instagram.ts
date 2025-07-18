import express, { Request, Response } from 'express'

const router = express.Router()

router.post('/connect', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Instagram connection endpoint working - OAuth integration needed'
  })
})

router.post('/post', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Instagram posting endpoint working - API integration needed'
  })
})

export default router
