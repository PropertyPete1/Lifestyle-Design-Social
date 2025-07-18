'use client';

import { useEffect, useState } from 'react';

export default function LearnStylePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const syncStyle = async () => {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/ai/learn-style', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary || 'Style synced successfully!');
        setStatus('done');
      } else {
        setError(data.error || 'Style sync failed.');
        setStatus('error');
      }
    } catch (e) {
      setError('An error occurred.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">🧠 Sync Your Instagram Style</h1>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        Press the button below to let the AI analyze your recent posts and learn your personal
        caption style.
      </p>

      <button
        onClick={syncStyle}
        disabled={status === 'loading'}
        className="bg-black text-white font-semibold px-6 py-2 rounded disabled:opacity-50"
      >
        {status === 'loading' ? 'Analyzing...' : 'Sync Instagram Style'}
      </button>

      {summary && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Summary:</h2>
          <p className="bg-gray-100 dark:bg-gray-800 p-3 rounded">{summary}</p>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
} 