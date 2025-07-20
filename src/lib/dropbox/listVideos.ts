import { dropboxClient } from './client';
import * as Sentry from '@sentry/node';

export async function listDropboxVideos(folderPath: string = '/videos') {
  try {
    const response = await dropboxClient.filesListFolder({ path: folderPath });
    return response.result.entries.filter((entry) => entry.name.endsWith('.mp4'));
  } catch (error) {
    console.error('Error listing Dropbox videos:', error);
    Sentry.captureException(error, {
      tags: { component: 'listDropboxVideos', folderPath },
      extra: { folderPath }
    });
    return [];
  }
} 