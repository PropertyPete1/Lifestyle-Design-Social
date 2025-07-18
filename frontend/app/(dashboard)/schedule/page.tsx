'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

type ScheduledPost = {
  id: string;
  videoTitle: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  scheduledAt: string;
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [weekDays, setWeekDays] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) =>
      format(addDays(start, i), 'EEE dd')
    );
    setWeekDays(days);
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📅 Weekly Schedule</h1>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="bg-gray-800 p-3 rounded-lg min-h-[120px]">
            <div className="font-semibold text-sm text-white">{day}</div>
            <div className="mt-2 space-y-1">
              {posts
                .filter(post =>
                  format(new Date(post.scheduledAt), 'EEE dd') === day
                )
                .map(post => (
                  <div
                    key={post.id}
                    className={cn(
                      'text-xs px-2 py-1 rounded text-white',
                      post.platform === 'instagram' && 'bg-pink-500',
                      post.platform === 'tiktok' && 'bg-black',
                      post.platform === 'youtube' && 'bg-red-600'
                    )}
                  >
                    {post.videoTitle}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 