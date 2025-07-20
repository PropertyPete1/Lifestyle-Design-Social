import { Router } from 'express';

const router = Router();

router.get('/sentry-test', (req, res) => {
  throw new Error("🔥 Sentry is catching this test error!");
});

export default router; 