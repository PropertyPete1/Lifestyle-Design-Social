import fs from 'fs';
import path from 'path';

export function isTooManyFiles(currentCount: number, max = 100): boolean {
  return currentCount >= max;
}

export function getThumbnailCount(): number {
  try {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(thumbnailsDir);
    return files.filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length;
  } catch (error) {
    console.error('Error counting thumbnails:', error);
    return 0;
  }
}

export function isThumbnailLimitReached(max = 100): boolean {
  const currentCount = getThumbnailCount();
  return isTooManyFiles(currentCount, max);
}

export function getThumbnailSize(): number {
  try {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(thumbnailsDir);
    let totalSize = 0;
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const filePath = path.join(thumbnailsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize; // Returns size in bytes
  } catch (error) {
    console.error('Error calculating thumbnail size:', error);
    return 0;
  }
}

export function isThumbnailSizeLimitReached(maxSizeMB = 500): boolean {
  const currentSize = getThumbnailSize();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return currentSize >= maxSizeBytes;
}

export function cleanupOldThumbnails(maxAge = 30): void {
  try {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      return;
    }
    
    const files = fs.readdirSync(thumbnailsDir);
    const now = Date.now();
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const filePath = path.join(thumbnailsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAgeMs) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old thumbnail: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up thumbnails:', error);
  }
}

export function getThumbnailStats() {
  const count = getThumbnailCount();
  const size = getThumbnailSize();
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  
  return {
    count,
    sizeBytes: size,
    sizeMB: parseFloat(sizeMB),
    isCountLimitReached: isThumbnailLimitReached(),
    isSizeLimitReached: isThumbnailSizeLimitReached()
  };
}

export function canGenerateThumbnail(maxCount = 100, maxSizeMB = 500): {
  allowed: boolean;
  reason?: string;
  stats: ReturnType<typeof getThumbnailStats>;
} {
  const stats = getThumbnailStats();
  
  if (stats.isCountLimitReached) {
    return {
      allowed: false,
      reason: `Thumbnail count limit reached (${stats.count}/${maxCount})`,
      stats
    };
  }
  
  if (stats.isSizeLimitReached) {
    return {
      allowed: false,
      reason: `Thumbnail size limit reached (${stats.sizeMB}MB/${maxSizeMB}MB)`,
      stats
    };
  }
  
  return {
    allowed: true,
    stats
  };
} 