"use client";
import { useEffect, useState } from "react";

interface InstagramPost {
  id: string;
  caption: string;
  timestamp: string;
}

export default function InstagramPostLog() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch("/api/logs/instagram");
      const data = await res.json();
      setPosts(data.posts || []);
    }
    fetchPosts();
  }, []);

  return (
    <div>
      <h2 className="font-semibold">📱 Instagram Post Log</h2>
      <ul className="space-y-2 mt-2">
        {posts.map((post) => (
          <li key={post.id} className="border p-2 rounded shadow">
            <p className="font-medium">{post.caption}</p>
            <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 