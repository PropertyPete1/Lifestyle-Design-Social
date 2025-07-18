'use client';

import { useEffect, useState } from 'react';
import { IVideo } from '@/types/Video';
import Link from 'next/link';

export default function VideosPage() {
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        const data = await res.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Uploaded Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <video
              src={video.path}
              controls
              className="w-full h-48 object-cover rounded mb-2"
            />
            <p><strong>Filename:</strong> {video.filename}</p>
            <p><strong>Duration:</strong> {video.duration.toFixed(2)}s</p>
            <p>
              <strong>Resolution:</strong> {video.width}×{video.height}
            </p>
            <p><strong>Size:</strong> {(video.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Format:</strong> {video.format}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 