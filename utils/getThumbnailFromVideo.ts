export async function getThumbnail(filename: string): Promise<string | null> {
  try {
    const res = await fetch('/api/videos/thumbnail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });
    
    const data = await res.json();
    return data.success ? data.thumbnail : null;
  } catch (e) {
    console.error('Failed to get thumbnail:', e);
    return null;
  }
}

// Enhanced version with options
export async function getThumbnailWithOptions(
  filename: string, 
  options: { 
    timeout?: number; 
    retries?: number; 
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string | null> {
  const { timeout = 10000, retries = 2, onProgress } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch('/api/videos/thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.thumbnail) {
        onProgress?.(100);
        return data.thumbnail;
      } else {
        throw new Error(data.error || 'Thumbnail generation failed');
      }
    } catch (e) {
      console.error(`Thumbnail attempt ${attempt + 1} failed:`, e);
      
      if (attempt === retries) {
        return null;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      onProgress?.((attempt + 1) / (retries + 1) * 100);
    }
  }
  
  return null;
}

// Check if thumbnail already exists
export async function checkThumbnailExists(filename: string): Promise<boolean> {
  try {
    const thumbnailUrl = `/thumbnails/${filename}.jpg`;
    const res = await fetch(thumbnailUrl, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Get thumbnail URL without generating
export function getThumbnailUrl(filename: string): string {
  return `/thumbnails/${filename}.jpg`;
}

// Batch thumbnail generation
export async function generateThumbnailsBatch(
  filenames: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  let completed = 0;
  
  // Process in batches of 3 to avoid overwhelming the server
  const batchSize = 3;
  
  for (let i = 0; i < filenames.length; i += batchSize) {
    const batch = filenames.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (filename) => {
      const thumbnail = await getThumbnail(filename);
      results[filename] = thumbnail;
      completed++;
      onProgress?.(completed, filenames.length);
      return { filename, thumbnail };
    });
    
    await Promise.allSettled(batchPromises);
  }
  
  return results;
} 