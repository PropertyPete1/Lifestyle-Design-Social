import { Router } from 'express';

const router = Router();

router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from test route!', timestamp: new Date() });
});

export default router; 