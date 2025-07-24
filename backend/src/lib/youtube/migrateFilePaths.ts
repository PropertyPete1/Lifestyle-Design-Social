import { VideoQueue } from '../../services/videoQueue';
import { getLocalFilePath } from '../../services/localStorage';

export async function migrateFilePaths(): Promise<void> {
  try {
    console.log('🔄 Starting filePath migration for existing videos...');
    
    // Find all videos with local:// URLs but no filePath
    const localVideos = await VideoQueue.find({
      dropboxUrl: { $regex: '^local://' },
      filePath: { $exists: false }
    });

    console.log(`Found ${localVideos.length} local videos missing filePath`);

    let updated = 0;
    for (const video of localVideos) {
      try {
        // Extract filename from local:// URL
        const localFilename = video.dropboxUrl.replace('local://', '');
        const filePath = getLocalFilePath(localFilename);
        
        // Update the video with filePath
        await VideoQueue.findByIdAndUpdate(video._id, { filePath });
        updated++;
        
        console.log(`✅ Updated ${video.filename} with filePath: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to update ${video.filename}:`, error);
      }
    }

    console.log(`🎉 Migration complete! Updated ${updated} videos with filePath`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
} 