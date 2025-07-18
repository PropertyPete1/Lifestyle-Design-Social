'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DraftDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    fetch(`/api/drafts/${id}`)
      .then(res => res.json())
      .then(data => {
        setDraft(data);
        setCaption(data.caption);
      });
  }, [id]);

  const save = async () => {
    await fetch(`/api/drafts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    });
    router.push('/drafts');
  };

  if (!draft) return <p className="p-4 text-white">Loading...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <video src={draft.s3Url} controls className="rounded w-full mb-4" />
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        className="w-full h-32 bg-gray-900 text-white rounded p-2"
      />
      <button
        onClick={save}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Save Caption
      </button>
    </div>
  );
} 