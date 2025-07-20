import express from 'express';
import retryRoutes from './retry';

const router = express.Router();

router.use('/retry', retryRoutes);

export default router; 