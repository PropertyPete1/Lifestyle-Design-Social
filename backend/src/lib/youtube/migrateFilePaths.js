"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateFilePaths = migrateFilePaths;
const videoQueue_1 = require("../../services/videoQueue");
const localStorage_1 = require("../../services/localStorage");
async function migrateFilePaths() {
    try {
        console.log('🔄 Starting filePath migration for existing videos...');
        // Find all videos with local:// URLs but no filePath
        const localVideos = await videoQueue_1.VideoQueue.find({
            dropboxUrl: { $regex: '^local://' },
            filePath: { $exists: false }
        });
        console.log(`Found ${localVideos.length} local videos missing filePath`);
        let updated = 0;
        for (const video of localVideos) {
            try {
                // Extract filename from local:// URL
                const localFilename = video.dropboxUrl.replace('local://', '');
                const filePath = (0, localStorage_1.getLocalFilePath)(localFilename);
                // Update the video with filePath
                await videoQueue_1.VideoQueue.findByIdAndUpdate(video._id, { filePath });
                updated++;
                console.log(`✅ Updated ${video.filename} with filePath: ${filePath}`);
            }
            catch (error) {
                console.error(`❌ Failed to update ${video.filename}:`, error);
            }
        }
        console.log(`🎉 Migration complete! Updated ${updated} videos with filePath`);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
