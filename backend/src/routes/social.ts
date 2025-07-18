import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import instagramRoutes from './instagram';

const router = Router();

// Apply authentication to all social routes
router.use(authenticateToken);

// Mount Instagram routes under /api/social/instagram
router.use('/instagram', instagramRoutes);

export default router;
