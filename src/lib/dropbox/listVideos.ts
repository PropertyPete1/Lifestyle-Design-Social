import { dropboxClient } from './client';

export async function listDropboxVideos(folderPath: string = '/videos') {
  try {
    const response = await dropboxClient.filesListFolder({ path: folderPath });
    return response.result.entries.filter((entry) => entry.name.endsWith('.mp4'));
  } catch (error) {
    console.error('Error listing Dropbox videos:', error);
    return [];
  }
} 