// 🛠️ Instructions:
// • Create this file at the path above.
// • This function sends a POST request to your /api/caption endpoint using the video data.

import { Video } from '@/lib/types';

export async function generateCaption(video: Video): Promise<string | null> {
  try {
    const res = await fetch('/api/caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }

    const data = await res.json();
    return data.caption;
  } catch (err) {
    console.error('[generateCaption error]', err);
    return null;
  }
} 