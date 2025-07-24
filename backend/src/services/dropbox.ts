import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
let dropboxApiKey = process.env.DROPBOX_API_KEY || '';

if (!dropboxApiKey && fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    dropboxApiKey = settings.dropboxApiKey || '';
  } catch (e) {
    console.error('Failed to read Dropbox API key from settings.json:', e);
  }
}

if (!dropboxApiKey) {
  throw new Error('Dropbox API key not set in environment or settings.json');
}

const dbx = new Dropbox({ accessToken: dropboxApiKey });

export async function uploadToDropbox(buffer: Buffer, filename: string): Promise<string> {
  const dropboxPath = `/Lifestyle Design Social/${Date.now()}_${filename}`;
  const response = await dbx.filesUpload({
    path: dropboxPath,
    contents: buffer,
    mode: { ".tag": "add" },
    autorename: true,
    mute: false,
  });
  // Create a shared link
  const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: response.result.path_display! });
  // Convert Dropbox shared link to direct download link
  return shared.result.url.replace('?dl=0', '?raw=1');
} 