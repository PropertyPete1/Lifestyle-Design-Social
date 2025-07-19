import { Router } from 'express';
import statusRoutes from './status';
import cartoonRoutes from './cartoons';

const router = Router();

router.use('/', statusRoutes);
router.use('/cartoons', cartoonRoutes);

export default router; 