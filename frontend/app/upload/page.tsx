'use client';

import { useState } from 'react';

export default function UploadAndCaptionPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    setLoading(true);
    setError('');
    setCaption('');

    const formData = new FormData();
    formData.append('video', video);

    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setCaption(data.caption);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !video}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? 'Generating Caption...' : 'Generate AI Caption'}
        </button>
      </form>

      {caption && (
        <div className="mt-6 p-4 border rounded bg-gray-100">
          <h3 className="font-semibold mb-2">Suggested Caption:</h3>
          <p>{caption}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 font-medium">{error}</div>
      )}
    </div>
  );
} 