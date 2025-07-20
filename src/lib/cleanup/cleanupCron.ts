import { cleanOldVideos } from './s3Cleaner';
import { checkStorageUsage } from '../utils/storageMonitor';

export async function runScheduledCleanup() {
  try {
    console.log('🔄 Starting scheduled S3 cleanup...');
    
    // Check storage before cleanup
    const bucketName = process.env.AWS_S3_BUCKET!;
    const alert = await checkStorageUsage(bucketName);
    
    if (alert) {
      console.log(`⚠️ Storage alert: ${alert.message}`);
    }
    
    // Run cleanup
    await cleanOldVideos();
    console.log('✅ S3 cleanup completed.');
    
    // Check storage after cleanup
    const alertAfter = await checkStorageUsage(bucketName);
    if (alertAfter) {
      console.log(`⚠️ Storage still high after cleanup: ${alertAfter.message}`);
    } else {
      console.log('✅ Storage levels are now acceptable.');
    }
    
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    throw err; // Re-throw for external schedulers to handle
  }
}

export async function runStorageCheck() {
  try {
    console.log('📊 Checking storage usage...');
    
    const bucketName = process.env.AWS_S3_BUCKET!;
    const alert = await checkStorageUsage(bucketName);
    
    if (alert) {
      console.log(`🚨 ${alert.level.toUpperCase()}: ${alert.message}`);
      // Here you could add notifications to Slack, email, etc.
      return { hasAlert: true, alert };
    } else {
      console.log('✅ Storage usage is normal.');
      return { hasAlert: false, alert: null };
    }
    
  } catch (err) {
    console.error('❌ Storage check failed:', err);
    throw err;
  }
}

export async function runFullMaintenance() {
  try {
    console.log('🔧 Starting full maintenance routine...');
    
    // Run storage check
    await runStorageCheck();
    
    // Run cleanup
    await runScheduledCleanup();
    
    console.log('✅ Full maintenance completed successfully.');
    
  } catch (err) {
    console.error('❌ Full maintenance failed:', err);
    throw err;
  }
} 