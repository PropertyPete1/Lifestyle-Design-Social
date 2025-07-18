'use client';

import { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';

export default function CaptionsPage() {
  const [input, setInput] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    setCaption('');
    setHashtags([]);

    try {
      const res = await fetch('http://localhost:5000/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input }),
      });
      const data = await res.json();
      setCaption(data.caption || '');
      setHashtags(data.hashtags || []);
    } catch (error) {
      console.error('Caption generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="text-white">
        <h2 className="text-xl font-bold mb-4">Generate AI Captions & Hashtags</h2>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your post or property..."
          className="w-full p-4 rounded bg-black border border-gray-700 text-white mb-4"
          rows={4}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !input}
          className="bg-brand text-black px-6 py-2 rounded font-bold hover:opacity-90"
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>

        {caption && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">📝 Caption:</h3>
            <p className="bg-[#111] p-4 rounded border border-gray-700 whitespace-pre-line">{caption}</p>
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">🏷️ Hashtags:</h3>
            <div className="bg-[#111] p-4 rounded border border-gray-700 flex flex-wrap gap-2 text-sm">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-brand">#{tag.replace('#', '')}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 