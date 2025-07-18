'use client';

import { useState } from 'react';
import axios from 'axios';

export default function CaptionGeneratorPage() {
  const [videoType, setVideoType] = useState('real estate');
  const [tone, setTone] = useState('friendly');
  const [style, setStyle] = useState('Instagram-friendly');
  const [location, setLocation] = useState('San Antonio, TX');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setCaption('');
    setHashtags([]);

    try {
      const response = await axios.post('/api/generate-caption', {
        videoType,
        tone,
        style,
        location,
      });

      setCaption(response.data.caption);
      setHashtags(response.data.hashtags);
    } catch (err) {
      alert('Failed to generate caption.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎯 Caption Generator</h1>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Video Type</label>
          <select
            value={videoType}
            onChange={(e) => setVideoType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="real estate">Real Estate</option>
            <option value="cartoon">Cartoon</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Tone</label>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Style</label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>

        {caption && (
          <div className="mt-6 bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-bold mb-2">Generated Caption:</h2>
            <p>{caption}</p>

            <h2 className="text-lg font-bold mt-4 mb-2">Hashtags:</h2>
            <p>{hashtags.join(' ')}</p>
          </div>
        )}
      </div>
    </div>
  );
} 