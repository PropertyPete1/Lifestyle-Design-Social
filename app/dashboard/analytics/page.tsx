'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  timestamp: string;
  videoUrl: string;
  views: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData[]>([]);

  useEffect(() => {
    // Replace this with actual API call to fetch analytics
    setData([
      {
        timestamp: '2024-07-01T12:00:00Z',
        videoUrl: 'https://s3.amazonaws.com/bucket/video1.mp4',
        views: 340,
      },
      {
        timestamp: '2024-07-02T08:30:00Z',
        videoUrl: 'https://s3.amazonaws.com/bucket/video2.mp4',
        views: 812,
      },
    ]);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">📈 Instagram Analytics</h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-4 py-2 text-left">Timestamp</th>
            <th className="px-4 py-2 text-left">Video URL</th>
            <th className="px-4 py-2 text-left">Views</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-t border-gray-600">
              <td className="px-4 py-2">{new Date(item.timestamp).toLocaleString()}</td>
              <td className="px-4 py-2 text-blue-400 underline">
                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer">
                  {item.videoUrl.slice(0, 40)}...
                </a>
              </td>
              <td className="px-4 py-2">{item.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 