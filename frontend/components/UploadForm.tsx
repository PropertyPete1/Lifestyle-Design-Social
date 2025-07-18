'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      setVideo(file);
      setMessage('');
    } else {
      setMessage('Please upload an MP4 video.');
    }
  };

  const handleUpload = async () => {
    if (!video) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', video);

    const response = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      setMessage('✅ Upload successful!');
    } else {
      setMessage('❌ Upload failed.');
    }

    setUploading(false);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <input
        type="file"
        accept="video/mp4"
        onChange={handleFileChange}
        className="mb-4"
      />
      {video && <p className="mb-2 text-sm text-gray-300">{video.name}</p>}
      <button
        onClick={handleUpload}
        disabled={!video || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p className="mt-4 text-sm text-yellow-400">{message}</p>}
    </div>
  );
} 