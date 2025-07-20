import { Router } from 'express';
import { getS3StorageUsage, getStorageBreakdown, formatStorageSize } from '../lib/utils/storageMonitor';

const router = Router();

// Get basic storage usage
router.get('/usage', async (req, res) => {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const usage = await getS3StorageUsage(bucket);
    
    res.status(200).json({ 
      usageBytes: usage,
      usageFormatted: formatStorageSize(usage)
    });
  } catch (err) {
    console.error('Storage usage check failed:', err);
    res.status(500).json({ error: 'Unable to retrieve usage stats' });
  }
});

// Get detailed storage breakdown
router.get('/breakdown', async (req, res) => {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const breakdown = await getStorageBreakdown(bucket);
    
    res.status(200).json({
      ...breakdown,
      totalSizeFormatted: formatStorageSize(breakdown.totalSize),
      averageFileSizeFormatted: formatStorageSize(breakdown.averageFileSize),
    });
  } catch (err) {
    console.error('Storage breakdown check failed:', err);
    res.status(500).json({ error: 'Unable to retrieve breakdown stats' });
  }
});

// Get storage alerts
router.get('/alerts', async (req, res) => {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const maxSizeGB = parseInt(req.query.maxSize as string) || 100;
    
    const { checkStorageUsage } = await import('../lib/utils/storageMonitor');
    const alert = await checkStorageUsage(bucket, maxSizeGB);
    
    res.status(200).json({ alert });
  } catch (err) {
    console.error('Storage alert check failed:', err);
    res.status(500).json({ error: 'Unable to retrieve alert status' });
  }
});

export default router; 