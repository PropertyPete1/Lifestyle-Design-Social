import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { InstagramArchive } from '../models/InstagramContent';

const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');

let settings: any = {};
try {
  if (fs.existsSync(settingsPath)) {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    settings = JSON.parse(settingsContent);
  }
} catch (error) {
  console.error('Failed to load Dropbox settings:', error);
}

const dropboxApiKey = settings.dropboxApiKey;

export class DropboxService {
  private dropbox: Dropbox;

  constructor(accessToken: string) {
    this.dropbox = new Dropbox({ 
      accessToken,
      fetch: fetch as any 
    });
  }

  /**
   * Upload a file to Dropbox.
   */
  async uploadToDropbox(buffer: Buffer, filename: string): Promise<string> {
    const dropboxPath = `/Lifestyle Design Social/${Date.now()}_${filename}`;
    const response = await this.dropbox.filesUpload({
      path: dropboxPath,
      contents: buffer,
      mode: { ".tag": "add" },
      autorename: true,
      mute: false,
    });
    // Create a shared link
    const shared = await this.dropbox.sharingCreateSharedLinkWithSettings({ path: response.result.path_display! });
    // Convert Dropbox shared link to direct download link
    return shared.result.url.replace('?dl=0', '?raw=1');
  }

  /**
   * Phase 9: Auto-sync reposted Instagram video to Dropbox
   */
  async syncInstagramVideo(videoId: string, videoUrl: string, caption: string, repostDate: Date): Promise<{ success: boolean; dropboxPath?: string; error?: string }> {
    try {
      console.log(`📦 Phase 9 Dropbox Sync: Syncing video ${videoId}...`);

      // Download video from Instagram URL
      const videoBuffer = await this.downloadVideoFromUrl(videoUrl);
      
      // Create filename with proper format: YYYY-MM-DD_CaptionSnippet.mp4
      const dateStr = repostDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const captionSnippet = this.createCaptionSnippet(caption);
      const filename = `${dateStr}_${captionSnippet}.mp4`;
      
      // Upload to Dropbox in organized folder structure
      const dropboxPath = `/SyncedInstagramPosts/${filename}`;
      
      await this.dropbox.filesUpload({
        path: dropboxPath,
        contents: videoBuffer,
        mode: 'overwrite' as any,
        autorename: false
      });

      // Update database record
      await InstagramArchive.findOneAndUpdate(
        { videoId },
        { 
          dropboxSynced: true, 
          dropboxPath,
          lastSyncDate: new Date()
        }
      );

      console.log(`✅ Successfully synced ${videoId} to ${dropboxPath}`);
      
      return {
        success: true,
        dropboxPath
      };

    } catch (error) {
      console.error(`❌ Dropbox sync failed for ${videoId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  /**
   * Download video from Instagram URL
   */
  private async downloadVideoFromUrl(videoUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      console.error('❌ Error downloading video:', error);
      throw new Error(`Video download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a clean caption snippet for filename
   */
  private createCaptionSnippet(caption: string): string {
    // Clean caption for filename use
    let snippet = caption
      .replace(/[#@]/g, '') // Remove hashtags and mentions
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
      .toLowerCase();

    // Ensure we have something meaningful
    if (snippet.length < 5) {
      snippet = `instagram_video_${Date.now()}`;
    }

    return snippet;
  }

  /**
   * Phase 9: Bulk sync multiple Instagram videos
   */
  async bulkSyncInstagramVideos(videos: Array<{
    videoId: string;
    videoUrl: string;
    caption: string;
    repostDate: Date;
  }>): Promise<{
    successful: number;
    failed: number;
    results: Array<{ videoId: string; success: boolean; dropboxPath?: string; error?: string }>;
  }> {
    console.log(`📦 Phase 9 Bulk Sync: Starting sync of ${videos.length} videos...`);

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const video of videos) {
      const result = await this.syncInstagramVideo(
        video.videoId,
        video.videoUrl,
        video.caption,
        video.repostDate
      );

      results.push({
        videoId: video.videoId,
        ...result
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting - be nice to Dropbox API
      await this.delay(1000);
    }

    console.log(`✅ Bulk sync complete: ${successful} successful, ${failed} failed`);

    return {
      successful,
      failed,
      results
    };
  }

  /**
   * Phase 9: Get sync status for Instagram archive
   */
  async getInstagramSyncStatus(): Promise<{
    totalVideos: number;
    syncedVideos: number;
    pendingSync: number;
    lastSyncDate?: Date;
    syncedSize: number; // in MB
  }> {
    try {
      // Get database stats
      const totalVideos = await InstagramArchive.countDocuments({ mediaType: 'VIDEO' });
      const syncedVideos = await InstagramArchive.countDocuments({ 
        mediaType: 'VIDEO',
        dropboxSynced: true 
      });
      const pendingSync = totalVideos - syncedVideos;

      // Get last sync date
      const lastSynced = await InstagramArchive.findOne({ 
        dropboxSynced: true 
      }).sort({ scrapedAt: -1 });
      
      const lastSyncDate = lastSynced?.scrapedAt;

      // Calculate synced folder size
      const syncedSize = await this.calculateSyncedFolderSize();

      return {
        totalVideos,
        syncedVideos,
        pendingSync,
        lastSyncDate,
        syncedSize
      };

    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return {
        totalVideos: 0,
        syncedVideos: 0,
        pendingSync: 0,
        syncedSize: 0
      };
    }
  }

  /**
   * Calculate the size of synced Instagram folder in Dropbox
   */
  private async calculateSyncedFolderSize(): Promise<number> {
    try {
      const folderResult = await this.dropbox.filesListFolder({
        path: '/SyncedInstagramPosts',
        recursive: true
      });

      let totalSize = 0;
      
      for (const entry of folderResult.result.entries) {
        if (entry['.tag'] === 'file') {
          totalSize += (entry as any).size || 0;
        }
      }

      // Convert to MB
      return Math.round(totalSize / (1024 * 1024));

    } catch (error) {
      console.warn('⚠️ Could not calculate Dropbox folder size:', error);
      return 0;
    }
  }

  /**
   * Phase 9: Sync pending Instagram videos that haven't been synced yet
   */
  async syncPendingInstagramVideos(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Phase 9: Syncing pending Instagram videos...');

      // Find videos that need syncing
      const pendingVideos = await InstagramArchive.find({
        mediaType: 'VIDEO',
        reposted: true, // Only sync videos that have been reposted
        dropboxSynced: { $ne: true }
      }).limit(20); // Process in batches

      if (pendingVideos.length === 0) {
        console.log('✅ No pending videos to sync');
        return { processed: 0, successful: 0, failed: 0, errors: [] };
      }

      console.log(`📦 Found ${pendingVideos.length} videos to sync...`);

      const videoData = pendingVideos.map(video => ({
        videoId: video.videoId,
        videoUrl: video.media_url,
        caption: video.caption,
        repostDate: video.lastRepostDate || video.scrapedAt
      }));

      const result = await this.bulkSyncInstagramVideos(videoData);

      return {
        processed: pendingVideos.length,
        successful: result.successful,
        failed: result.failed,
        errors: result.results
          .filter(r => !r.success)
          .map(r => `${r.videoId}: ${r.error}`)
      };

    } catch (error) {
      console.error('❌ Error syncing pending videos:', error);
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Phase 9: Clean up Dropbox folder - remove files older than 6 months
   */
  async cleanupOldSyncedVideos(): Promise<{
    deletedCount: number;
    freedSpace: number; // in MB
  }> {
    try {
      console.log('🧹 Phase 9: Cleaning up old synced videos...');

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const folderResult = await this.dropbox.filesListFolder({
        path: '/SyncedInstagramPosts',
        recursive: true
      });

      let deletedCount = 0;
      let freedSpace = 0;

      for (const entry of folderResult.result.entries) {
        if (entry['.tag'] === 'file') {
          const fileEntry = entry as any;
          const modifiedTime = new Date(fileEntry.client_modified);
          
          if (modifiedTime < sixMonthsAgo) {
            try {
              await this.dropbox.filesDeleteV2({ path: fileEntry.path_lower });
              deletedCount++;
              freedSpace += Math.round((fileEntry.size || 0) / (1024 * 1024));
              
              console.log(`🗑️ Deleted old file: ${fileEntry.name}`);
            } catch (deleteError) {
              console.warn(`⚠️ Could not delete ${fileEntry.name}:`, deleteError);
            }
          }
        }
      }

      console.log(`✅ Cleanup complete: ${deletedCount} files deleted, ${freedSpace}MB freed`);

      return {
        deletedCount,
        freedSpace
      };

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return {
        deletedCount: 0,
        freedSpace: 0
      };
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Legacy function for backward compatibility
const dbx = new Dropbox({ accessToken: dropboxApiKey });

export async function uploadToDropbox(buffer: Buffer, filename: string): Promise<string> {
  const dropboxService = new DropboxService(dropboxApiKey);
  return dropboxService.uploadToDropbox(buffer, filename);
}

// Create singleton instance for Phase 9
export const dropboxService = new DropboxService(dropboxApiKey); 