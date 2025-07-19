'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  async function handleUpload() {
    if (!videoFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('video', videoFile);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setVideoUrl(data.url);
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        className="block text-white"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>

      {videoUrl && (
        <p className="text-green-400 break-all">Uploaded to: {videoUrl}</p>
      )}
    </div>
  );
} 