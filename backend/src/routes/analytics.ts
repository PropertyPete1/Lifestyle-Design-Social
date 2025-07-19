import { Router } from 'express';
import { getAnalyticsSummaryHandler } from '../controllers/analytics';

const router = Router();

router.get('/summary/:userId', getAnalyticsSummaryHandler);

export default router; 