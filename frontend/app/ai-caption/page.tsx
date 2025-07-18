'use client';

import { useState } from 'react';

export default function AICaptionPage() {
  const [input, setInput] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      if (res.ok) {
        setCaption(data.caption);
        setHashtags(data.hashtags || []);
      } else {
        setError(data.error || 'Failed to generate caption.');
      }
    } catch (e) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">🤖 AI Caption & Hashtag Generator</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your video or give a topic..."
        className="w-full h-32 p-3 border dark:border-gray-700 rounded mb-4"
      />

      <button
        onClick={generate}
        disabled={loading}
        className="bg-blue-600 text-white font-semibold px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Caption'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {caption && (
        <div className="mt-6">
          <h2 className="font-bold mb-1">Generated Caption:</h2>
          <p className="bg-gray-100 dark:bg-gray-800 p-3 rounded">{caption}</p>
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="mt-4">
          <h2 className="font-bold mb-1">Hashtags:</h2>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, i) => (
              <span
                key={i}
                className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-white px-3 py-1 rounded text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 