// 🛠️ Instructions:
// • Replace the file with this version to enable saving to the database.
// • Make sure the backend route `/api/caption/save` is working (we'll build that next).

'use client';

import { useState } from 'react';
import { generateCaption } from '@/lib/actions/generateCaption';

export default function CaptionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateCaption({ title, description, location });
    setCaption(result || 'Failed to generate caption.');
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/caption/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, caption }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Saved successfully!');
      } else {
        setMessage('❌ Failed to save.');
      }
    } catch (err) {
      setMessage('❌ Error saving caption.');
    }
    setSaving(false);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Caption Generator</h1>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Video Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Video Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-black text-white rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>
      </div>

      {caption && (
        <div className="p-4 border rounded bg-gray-100 space-y-2">
          <div>
            <h2 className="font-semibold mb-1">Generated Caption:</h2>
            <p>{caption}</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save to Database'}
          </button>
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
} 