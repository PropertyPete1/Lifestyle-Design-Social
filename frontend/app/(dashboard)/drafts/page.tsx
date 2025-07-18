'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Draft = {
  _id: string;
  s3Url: string;
  caption: string;
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    fetch('/api/drafts')
      .then(res => res.json())
      .then(setDrafts)
      .catch(() => setDrafts([]));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">🎬 Video Drafts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {drafts.map(draft => (
          <Link
            key={draft._id}
            href={`/drafts/${draft._id}`}
            className="bg-gray-900 rounded shadow p-2 hover:scale-105 transition"
          >
            <video src={draft.s3Url} className="rounded w-full mb-2" controls />
            <p className="text-sm text-white line-clamp-2">{draft.caption}</p>
          </Link>
        ))}
      </div>
    </div>
  );
} 