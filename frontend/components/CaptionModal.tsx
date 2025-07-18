// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • This modal lets users generate captions with hashtags using OpenAI.

'use client';

import { useState } from 'react';
import { Video } from '@/lib/types';
import { generateCaptionWithHashtags } from '@/lib/api';

type CaptionModalProps = {
  video: Video;
  onClose: () => void;
};

export default function CaptionModal({ video, onClose }: CaptionModalProps) {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generateCaptionWithHashtags(video);
      setCaption(generated.caption);
    } catch (err) {
      alert('Error generating caption');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Generate Caption</h2>
        <p className="text-sm text-gray-500 mb-2">Video: {video.caption}</p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-4 w-full h-24 border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 