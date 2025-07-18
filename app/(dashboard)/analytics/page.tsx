'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type AnalyticsData = {
  _id: string;
  platform: 'instagram' | 'youtube';
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  videoId: string;
  postedAt: string;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/analytics/get')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">📊 Performance Analytics</h1>
      {loading ? (
        <p>Loading metrics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div
              key={item._id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700"
            >
              <p className="text-sm mb-1 text-gray-400">
                {item.platform.toUpperCase()} • {new Date(item.postedAt).toLocaleDateString()}
              </p>
              <h2 className="text-xl font-semibold truncate">📹 {item.videoId}</h2>
              <ul className="mt-2 space-y-1 text-sm text-gray-300">
                <li>👀 Views: {item.views.toLocaleString()}</li>
                <li>❤️ Likes: {item.likes.toLocaleString()}</li>
                <li>💬 Comments: {item.comments.toLocaleString()}</li>
                {item.shares !== undefined && <li>🔁 Shares: {item.shares.toLocaleString()}</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 