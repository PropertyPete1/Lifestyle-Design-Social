// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • This helper sends video data to the backend endpoint and returns the generated caption.

import { Video } from '@/lib/types';

export async function generateCaptionWithHashtags(video: Video): Promise<{ caption: string }> {
  const res = await fetch('/api/caption', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(video),
  });

  if (!res.ok) {
    throw new Error('Failed to generate caption');
  }

  return res.json();
} 