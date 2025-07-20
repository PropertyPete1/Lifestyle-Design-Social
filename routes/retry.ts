import express from 'express';
import { manualRetry } from '../controllers/retryController';

const router = express.Router();

router.post('/manual', manualRetry);

export default router; 