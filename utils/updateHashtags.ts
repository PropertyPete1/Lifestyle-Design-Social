export async function updateHashtags(caption: string): Promise<string> {
  const res = await fetch('/api/caption/auto-replace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption }),
  });

  const data = await res.json();
  return data.updatedCaption || caption;
} 