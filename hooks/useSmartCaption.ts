import { useState } from 'react';

export function useSmartCaption() {
  const [enhanced, setEnhanced] = useState('');
  const [loading, setLoading] = useState(false);

  const enhance = async (baseCaption: string) => {
    setLoading(true);
    const res = await fetch('/api/captions/fullEnhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseCaption }),
    });
    const data = await res.json();
    setEnhanced(data.final);
    setLoading(false);
  };

  return { enhanced, enhance, loading };
} 