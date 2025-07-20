import { useState } from 'react';

export function useEnhanceMemory() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const enhance = async (caption: string) => {
    setLoading(true);
    const res = await fetch('/api/caption/gpt-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    });
    const data = await res.json();
    setOutput(data.enhanced || '');
    setLoading(false);
  };

  return { loading, output, enhance };
} 