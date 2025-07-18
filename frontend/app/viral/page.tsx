'use client';

import { useState } from 'react';

export default function ViralOptimizerPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState('');
  const [music, setMusic] = useState('');
  const [cta, setCta] = useState('');
  const [score, setScore] = useState<number | null>(null);
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
    setThumbnail('');
    setMusic('');
    setCta('');
    setScore(null);

    const formData = new FormData();
    formData.append('video', video);

    try {
      const res = await fetch('/api/viral-optimize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setThumbnail(data.thumbnail);
        setMusic(data.music);
        setCta(data.cta);
        setScore(data.score);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Optimization failed. Please try again.');
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
          {loading ? 'Analyzing...' : 'Run Viral Optimization'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {score !== null && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg">Viral Score: {score}/10</h3>
          <p className="mt-2"><strong>Suggested CTA:</strong> {cta}</p>
          <p><strong>Suggested Music:</strong> {music}</p>

          {thumbnail && (
            <div className="mt-4">
              <h4 className="font-medium mb-1">Generated Thumbnail</h4>
              <img src={thumbnail} alt="Generated Thumbnail" className="rounded border" />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 