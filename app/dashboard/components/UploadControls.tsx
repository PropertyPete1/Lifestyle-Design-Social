'use client';

import { useState } from 'react';

interface Props {
  fileName: string;
}

export default function UploadControls({ fileName }: Props) {
  const [status, setStatus] = useState('');

  const handleInstagram = async () => {
    setStatus('📤 Uploading to Instagram...');
    const res = await fetch('/api/publish/instagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption: 'Check this out! 🔥',
        videoUrl: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${fileName}`,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setStatus('✅ Posted to Instagram!');
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
  };

  const handleYouTube = async () => {
    setStatus('📤 Uploading to YouTube...');
    const res = await fetch('/api/publish/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Automated Upload',
        description: 'Uploaded via Lifestyle Design Social ✨',
        videoUrl: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${fileName}`,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setStatus('✅ Posted to YouTube!');
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
  };

  return (
    <div className="mt-2 flex gap-4 items-center">
      <button
        onClick={handleInstagram}
        className="bg-pink-600 hover:bg-pink-500 text-white text-sm px-3 py-1 rounded"
      >
        📸 Instagram
      </button>
      <button
        onClick={handleYouTube}
        className="bg-red-600 hover:bg-red-500 text-white text-sm px-3 py-1 rounded"
      >
        ▶️ YouTube
      </button>
      <span className="text-xs text-gray-400">{status}</span>
    </div>
  );
} 