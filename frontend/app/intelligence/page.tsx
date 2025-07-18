'use client';

import { useState } from 'react';

export default function VideoIntelligencePage() {
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('video', video);

    try {
      const res = await fetch('/api/intelligence-analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium">Upload Video</label>
          <input type="file" accept="video/*" onChange={handleFileChange} />
        </div>

        <button
          type="submit"
          disabled={loading || !video}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? 'Analyzing...' : 'Run Intelligence Analysis'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50 space-y-3">
          <h3 className="font-semibold text-lg">Intelligence Report</h3>
          <p><strong>Scene:</strong> {result.scene}</p>
          <p><strong>Audio Mood:</strong> {result.audioMood}</p>
          <p><strong>Music Detected:</strong> {result.musicDetected ? 'Yes' : 'No'}</p>
          <p><strong>Compression Recommendation:</strong> {result.compression}</p>
          <p><strong>Quality Enhancements:</strong> {result.qualityTips}</p>
        </div>
      )}
    </div>
  );
} 