'use client';

import { useState } from 'react';

export default function CaptionForm() {
  const [videoType, setVideoType] = useState('');
  const [style, setStyle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCaption('');

    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoType,
          style,
          keywords: keywords.split(',').map(k => k.trim()),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCaption(data.caption);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Video Type</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={videoType}
            onChange={(e) => setVideoType(e.target.value)}
            placeholder="Real estate, cartoon, etc."
          />
        </div>

        <div>
          <label className="block font-medium">Style</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Professional, fun, luxury, etc."
          />
        </div>

        <div>
          <label className="block font-medium">Keywords</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="pool, modern kitchen, under $300k"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>
      </form>

      {caption && (
        <div className="mt-6 p-4 border rounded bg-gray-100">
          <h3 className="font-semibold">Generated Caption:</h3>
          <p>{caption}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  );
} 