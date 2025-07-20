export async function requestCartoon(videoUrl: string, promptType: string): Promise<string | null> {
  try {
    const res = await fetch('/api/cartoon/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, promptType }),
    });
    const data = await res.json();
    return data.cartoonUrl;
  } catch (e) {
    console.error('Failed to request cartoon:', e);
    return null;
  }
} 