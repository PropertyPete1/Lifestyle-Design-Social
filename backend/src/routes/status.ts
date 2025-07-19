import { Router } from 'express';
import { statusCheck } from '../controllers/statusController';

const router = Router();

router.get('/status', statusCheck);

export default router; 