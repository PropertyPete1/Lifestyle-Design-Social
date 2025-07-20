import AWS from "aws-sdk";
import * as Sentry from '@sentry/node';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export async function cleanOldVideos() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // List all objects in the videos folder
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: 'videos/',
    };

    const listResult = await s3.listObjectsV2(listParams).promise();
    
    if (!listResult.Contents) {
      console.log('No videos found in S3 bucket');
      return;
    }

    // Filter objects older than 30 days
    const oldObjects = listResult.Contents.filter((obj: AWS.S3.Object) => {
      if (!obj.LastModified) return false;
      return obj.LastModified < thirtyDaysAgo;
    });

    if (oldObjects.length === 0) {
      console.log('No old videos found to clean up');
      return;
    }

    // Delete old objects
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Delete: {
        Objects: oldObjects.map((obj: AWS.S3.Object) => ({ Key: obj.Key! })),
        Quiet: false,
      },
    };

    const deleteResult = await s3.deleteObjects(deleteParams).promise();
    
    console.log(`Cleaned up ${deleteResult.Deleted?.length || 0} old videos from S3`);
    
    if (deleteResult.Errors && deleteResult.Errors.length > 0) {
      console.error('Some objects failed to delete:', deleteResult.Errors);
      Sentry.captureMessage('Some S3 objects failed to delete during cleanup', {
        level: 'warning',
        tags: { component: 's3Cleaner' },
        extra: { errors: deleteResult.Errors }
      });
    }
    
  } catch (error) {
    console.error('S3 cleanup error:', error);
    Sentry.captureException(error, {
      tags: { component: 's3Cleaner', operation: 'cleanOldVideos' }
    });
    throw error;
  }
} 