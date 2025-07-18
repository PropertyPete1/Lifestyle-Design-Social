'use client';
import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';

export default function VideosPage() {
  const [videos, setVideos] = useState<File[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploaded = Array.from(e.target.files);
    setVideos(prev => [...prev, ...uploaded]);
  };

  return (
    <SidebarLayout>
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">📹 My Videos</h1>
        <input
          type="file"
          accept="video/mp4"
          multiple
          onChange={handleUpload}
          className="block mb-4 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <ul className="space-y-2">
          {videos.map((file, idx) => (
            <li key={idx} className="text-sm text-gray-400">
              {file.name}
            </li>
          ))}
        </ul>
      </div>
    </SidebarLayout>
  );
} 