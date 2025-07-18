'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface VideoData {
  _id: string;
  fileName: string;
  fileSize: number;
  duration: number;
  createdAt: string;
  performance: {
    views: number;
    likes: number;
    shares: number;
    engagementRate: number;
  };
}

export default function VideoDetailPage() {
  const params = useParams();
  const [video, setVideo] = useState<VideoData | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/videos/${params.id}`)
        .then((res) => res.json())
        .then((data) => setVideo(data))
        .catch((err) => console.error('Failed to fetch video:', err));
    }
  }, [params?.id]);

  if (!video) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{video.fileName}</h1>
      <ul className="space-y-2">
        <li><strong>File Size:</strong> {(video.fileSize / (1024 * 1024)).toFixed(2)} MB</li>
        <li><strong>Duration:</strong> {video.duration.toFixed(1)} seconds</li>
        <li><strong>Uploaded:</strong> {format(new Date(video.createdAt), 'PPPpp')}</li>
        <li><strong>Views:</strong> {video.performance?.views ?? 0}</li>
        <li><strong>Likes:</strong> {video.performance?.likes ?? 0}</li>
        <li><strong>Shares:</strong> {video.performance?.shares ?? 0}</li>
        <li><strong>Engagement Rate:</strong> {video.performance?.engagementRate ?? 0}%</li>
      </ul>
    </div>
  );
} 