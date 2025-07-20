import { syncDropboxToQueue } from '../lib/dropbox/syncToQueue';

export async function handleDropboxWebhook() {
  try {
    await syncDropboxToQueue();
    console.log('✅ Dropbox sync to queue completed.');
  } catch (err) {
    console.error('❌ Dropbox sync to queue failed:', err);
  }
} 