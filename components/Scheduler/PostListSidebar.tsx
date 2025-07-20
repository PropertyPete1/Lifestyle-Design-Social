import React from 'react';
import ScheduledPostCard from './ScheduledPostCard';

const mockPosts = [
  { id: 101, title: 'Reel for Monday' },
  { id: 102, title: 'Cartoon Reel' },
  { id: 103, title: 'Open House Teaser' },
];

export default function PostListSidebar() {
  return (
    <aside className="w-64 bg-gray-900 p-4 border-r border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-2">Scheduled Posts</h2>
      <div className="space-y-2">
        {mockPosts.map((post) => (
          <ScheduledPostCard key={post.id} post={post} />
        ))}
      </div>
    </aside>
  );
} 