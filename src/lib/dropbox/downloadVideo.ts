import { dropboxClient } from './client';

export async function downloadDropboxVideo(path: string) {
  try {
    const response = await dropboxClient.filesDownload({ path });
    return response.result.fileBinary as ArrayBuffer;
  } catch (error) {
    console.error(`Failed to download Dropbox video at ${path}:`, error);
    throw error;
  }
} 