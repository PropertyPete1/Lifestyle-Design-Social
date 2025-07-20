import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export async function getS3StorageUsage(bucketName: string): Promise<number> {
  const listParams = {
    Bucket: bucketName,
  };

  const data = await s3.listObjectsV2(listParams).promise();
  const totalSize = data.Contents?.reduce((acc: number, obj: AWS.S3.Object) => acc + (obj.Size || 0), 0) || 0;
  return totalSize;
}

export interface StorageAlert {
  level: 'warning' | 'critical';
  message: string;
  currentSize: number;
  maxSize: number;
  percentageUsed: number;
}

export async function checkStorageUsage(bucketName: string, maxSizeGB: number = 100): Promise<StorageAlert | null> {
  try {
    const currentSizeBytes = await getS3StorageUsage(bucketName);
    const currentSizeGB = currentSizeBytes / (1024 * 1024 * 1024);
    const percentageUsed = (currentSizeGB / maxSizeGB) * 100;

    if (percentageUsed >= 90) {
      return {
        level: 'critical',
        message: `CRITICAL: S3 bucket ${bucketName} is ${percentageUsed.toFixed(1)}% full (${currentSizeGB.toFixed(2)}GB of ${maxSizeGB}GB)`,
        currentSize: currentSizeGB,
        maxSize: maxSizeGB,
        percentageUsed,
      };
    } else if (percentageUsed >= 75) {
      return {
        level: 'warning',
        message: `WARNING: S3 bucket ${bucketName} is ${percentageUsed.toFixed(1)}% full (${currentSizeGB.toFixed(2)}GB of ${maxSizeGB}GB)`,
        currentSize: currentSizeGB,
        maxSize: maxSizeGB,
        percentageUsed,
      };
    }

    return null; // No alert needed
  } catch (error) {
    console.error('Error checking storage usage:', error);
    throw error;
  }
}

export function formatStorageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function getStorageBreakdown(bucketName: string): Promise<{
  totalSize: number;
  fileCount: number;
  videoFiles: number;
  thumbnailFiles: number;
  averageFileSize: number;
}> {
  try {
    const listParams = {
      Bucket: bucketName,
    };

    const data = await s3.listObjectsV2(listParams).promise();
    const contents = data.Contents || [];

    const totalSize = contents.reduce((acc: number, obj: AWS.S3.Object) => acc + (obj.Size || 0), 0);
    const fileCount = contents.length;
    const videoFiles = contents.filter((obj: AWS.S3.Object) => obj.Key?.startsWith('videos/')).length;
    const thumbnailFiles = contents.filter((obj: AWS.S3.Object) => obj.Key?.includes('thumbnail')).length;
    const averageFileSize = fileCount > 0 ? totalSize / fileCount : 0;

    return {
      totalSize,
      fileCount,
      videoFiles,
      thumbnailFiles,
      averageFileSize,
    };
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    throw error;
  }
} 