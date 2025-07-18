"use client";
import { useEffect, useState } from "react";

interface YouTubePost {
  id: string;
  title: string;
  timestamp: string;
}

export default function YouTubePostLog() {
  const [posts, setPosts] = useState<YouTubePost[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch("/api/logs/youtube");
      const data = await res.json();
      setPosts(data.posts || []);
    }
    fetchPosts();
  }, []);

  return (
    <div>
      <h2 className="font-semibold">📺 YouTube Post Log</h2>
      <ul className="space-y-2 mt-2">
        {posts.map((post) => (
          <li key={post.id} className="border p-2 rounded shadow">
            <p className="font-medium">{post.title}</p>
            <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 