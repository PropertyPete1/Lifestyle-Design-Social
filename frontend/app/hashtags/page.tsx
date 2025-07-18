'use client';

import { useEffect, useState } from 'react';

type HashtagCategory = {
  category: string;
  tags: string[];
};

export default function HashtagPage() {
  const [hashtags, setHashtags] = useState<HashtagCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHashtags = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/hashtags');
      const data = await res.json();
      if (res.ok) {
        setHashtags(data.hashtags || []);
      } else {
        setError(data.error || 'Failed to fetch hashtags');
      }
    } catch (e) {
      setError('An error occurred while fetching hashtags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHashtags();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">🏷️ Hashtag Research</h1>
      {loading && <p>Loading hashtags...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hashtags.map(({ category, tags }, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="font-semibold mb-2 text-lg">{category}</h2>
            <ul className="space-y-1">
              {tags.map((tag, i) => (
                <li key={i} className="text-sm text-gray-800 dark:text-gray-200">
                  #{tag}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
} 