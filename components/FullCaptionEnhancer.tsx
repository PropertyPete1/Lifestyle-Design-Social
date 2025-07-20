'use client';

import { useState } from 'react';

export function FullCaptionEnhancer() {
  const [base, setBase] = useState('');
  const [enhanced, setEnhanced] = useState('');
  const [loading, setLoading] = useState(false);

  const enhance = async () => {
    setLoading(true);
    const res = await fetch('/api/captions/fullEnhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseCaption: base }),
    });
    const data = await res.json();
    setEnhanced(data.final);
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white dark:bg-gray-900">
      <textarea
        value={base}
        onChange={(e) => setBase(e.target.value)}
        placeholder="Original caption..."
        className="w-full p-2 border rounded mb-2"
      />
      <button onClick={enhance} className="bg-purple-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Enhancing...' : 'Enhance Caption + Hashtags'}
      </button>
      {enhanced && (
        <div className="mt-4 p-2 border-t">
          <h4 className="font-bold mb-1">Enhanced Caption:</h4>
          <p>{enhanced}</p>
        </div>
      )}
    </div>
  );
} 