import * as fs from 'fs';
import * as path from 'path';

/**
 * Local file storage service as fallback when Dropbox is unavailable
 */

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOAD_DIR}`);
}

export async function saveToLocal(buffer: Buffer, filename: string): Promise<string> {
  try {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}_${safeFilename}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Write file to local storage
    await fs.promises.writeFile(filePath, buffer);
    
    console.log(`✅ Saved to local storage: ${uniqueFilename}`);
    
    // Return local file path/URL
    return `local://${uniqueFilename}`;
    
  } catch (error) {
    console.error('Local storage error:', error);
    throw new Error(`Failed to save file locally: ${error}`);
  }
}

export function getLocalFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function listLocalFiles(): string[] {
  try {
    return fs.readdirSync(UPLOAD_DIR);
  } catch (error) {
    console.error('Error listing local files:', error);
    return [];
  }
} 