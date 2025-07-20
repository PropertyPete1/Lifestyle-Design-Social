'use client';
import { useEffect, useState } from 'react';

export default function HashtagPerformanceList() {
  const [hashtags, setHashtags] = useState<{ tag: string; avgViews: number }[]>([]);

  useEffect(() => {
    fetch('/api/hashtag/top')
      .then((res) => res.json())
      .then((data) => setHashtags(data.hashtags || []));
  }, []);

  return (
    <div className="p-4 border rounded bg-black text-white">
      <h2 className="text-xl font-bold mb-2">🔥 Top Performing Hashtags</h2>
      <ul className="list-disc ml-4">
        {hashtags.map((h) => (
          <li key={h.tag}>
            {h.tag} — <span className="text-gray-400">{Math.round(h.avgViews)} avg views</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 