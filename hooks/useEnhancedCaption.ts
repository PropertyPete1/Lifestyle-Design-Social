import { useState } from 'react';

export function useEnhancedCaption() {
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');

  async function fetchEnhanced(original: string) {
    setLoading(true);
    const res = await fetch('/api/caption/gpt-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: original }),
    });
    const data = await res.json();
    setCaption(data.enhanced);
    setLoading(false);
  }

  return { caption, loading, fetchEnhanced };
} 