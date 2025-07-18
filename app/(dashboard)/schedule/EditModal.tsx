import React, { useState } from 'react';
import { Video } from '@/lib/types';

type Props = {
  video: Video | null;
  onSave: (v: Video) => void;
  onClose: () => void;
};

export default function EditModal({ video, onSave, onClose }: Props) {
  const [caption, setCaption] = useState(video?.caption || '');
  const [hashtags, setHashtags] = useState(video?.hashtags?.join(' ') || '');

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-[500px] shadow-lg">
        <h2 className="text-lg font-bold mb-4">Edit Video Post</h2>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          className="w-full mb-4 p-2 border dark:bg-gray-800 rounded"
        />
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#hashtags"
          className="w-full mb-4 p-2 border dark:bg-gray-800 rounded"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...video, caption, hashtags: hashtags.split(' ') })}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 