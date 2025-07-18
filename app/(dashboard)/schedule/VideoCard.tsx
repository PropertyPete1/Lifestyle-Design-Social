import React from 'react';
import { PlayCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Video } from '@/lib/types';

type Props = {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (videoId: string) => void;
};

export default function VideoCard({ video, onEdit, onDelete }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-sm font-semibold truncate">{video.title}</h3>
        <div className="flex gap-2">
          <button onClick={() => onEdit(video)} className="hover:text-green-400">
            <PencilIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onDelete(video._id)} className="hover:text-red-400">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{video.duration}s</span>
        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
} 