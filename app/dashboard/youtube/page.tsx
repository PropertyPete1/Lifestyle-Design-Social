'use client';

import { useEffect, useState } from 'react';

interface YouTubeLog {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  postedAt: string;
}

export default function YouTubeDashboard() {
  const [logs, setLogs] = useState<YouTubeLog[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch('/api/logs/youtube');
      const data = await res.json();
      setLogs(data);
    }

    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📺 YouTube Shorts Dashboard</h1>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto border p-4 rounded">
        {logs.map((log, index) => (
          <div key={index} className="border-b pb-2">
            <p className="font-semibold">{log.title}</p>
            <p className="text-sm text-gray-500">{log.description}</p>
            <p className="text-sm text-green-600">{log.videoUrl}</p>
            <p className="text-xs text-gray-400">{new Date(log.postedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 