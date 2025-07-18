'use client';

import { useEffect, useState } from 'react';
import { format, isToday } from 'date-fns';

type ScheduledPost = {
  id: string;
  title: string;
  platform: string;
  date: string;
  time: string;
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchScheduledPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/posts/scheduled');
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      } else {
        setError(data.error || 'Failed to load calendar posts.');
      }
    } catch (e) {
      setError('An error occurred while fetching posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">📅 Smart Post Calendar</h1>
      {loading && <p>Loading scheduled posts...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`p-4 rounded-lg border ${
              isToday(new Date(post.date))
                ? 'bg-green-100 border-green-400 dark:bg-green-900'
                : 'bg-white border-gray-200 dark:bg-gray-800'
            }`}
          >
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {post.platform} — {format(new Date(post.date), 'PPP')} at {post.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 