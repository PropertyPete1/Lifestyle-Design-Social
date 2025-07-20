import { Router } from 'express';
import { cleanOldVideos } from '../lib/cleanup/s3Cleaner';
import { checkStorageUsage, getStorageBreakdown, formatStorageSize } from '../lib/utils/storageMonitor';

const router = Router();

router.post('/s3', async (req, res) => {
  try {
    await cleanOldVideos();
    res.status(200).json({ message: 'S3 cleanup completed.' });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: 'S3 cleanup failed.' });
  }
});

// Storage monitoring endpoint
router.get('/storage', async (req, res) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET!;
    const maxSizeGB = parseInt(req.query.maxSize as string) || 100;

    const alert = await checkStorageUsage(bucketName, maxSizeGB);
    const breakdown = await getStorageBreakdown(bucketName);

    res.status(200).json({
      alert,
      breakdown: {
        ...breakdown,
        totalSizeFormatted: formatStorageSize(breakdown.totalSize),
        averageFileSizeFormatted: formatStorageSize(breakdown.averageFileSize),
      },
    });
  } catch (err) {
    console.error('Storage monitoring error:', err);
    res.status(500).json({ error: 'Storage monitoring failed.' });
  }
});

export default router; 