import express from 'express';
import manualRetryRoute from './manual';

const router = express.Router();

router.use('/', manualRetryRoute);

export default router; 