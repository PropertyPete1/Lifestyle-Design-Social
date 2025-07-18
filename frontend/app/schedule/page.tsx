'use client';

import { useEffect, useState } from 'react';

type ScheduledPost = {
  id: string;
  caption: string;
  platform: string;
  scheduledTime: string;
  status: 'pending' | 'posted' | 'failed';
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();

        if (res.ok) {
          setPosts(data);
        } else {
          setError(data.error || 'Failed to fetch schedule');
        }
      } catch {
        setError('Failed to fetch schedule');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📅 Smart Scheduler</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {posts.length === 0 && !loading && (
        <p className="text-gray-600">No scheduled posts found.</p>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border dark:border-gray-700 p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-gray-500">{new Date(post.scheduledTime).toLocaleString()}</p>
              <p className="font-semibold">{post.caption}</p>
              <p className="text-sm text-blue-600">{post.platform}</p>
            </div>
            <div className="text-sm font-bold capitalize">
              {post.status === 'pending' && <span className="text-yellow-500">Pending</span>}
              {post.status === 'posted' && <span className="text-green-600">Posted</span>}
              {post.status === 'failed' && <span className="text-red-600">Failed</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 