import { Router } from 'express';
import { postVideoHandler } from '../controllers/videos';

const router = Router();

router.post('/post', postVideoHandler);

export default router; 