'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DraftDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [scheduledFor, setScheduledFor] = useState('');

  useEffect(() => {
    fetch(`/api/drafts/${id}`)
      .then(res => res.json())
      .then(data => {
        setDraft(data);
        setCaption(data.caption);
        setPlatform(data.platform || 'instagram');
        setScheduledFor(data.scheduledFor?.slice(0, 16) || '');
      });
  }, [id]);

  const save = async () => {
    await fetch(`/api/drafts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, platform, scheduledFor }),
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
        className="w-full h-32 bg-gray-900 text-white rounded p-2 mb-2"
      />

      <div className="space-y-3">
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="w-full p-2 bg-gray-800 text-white rounded"
        >
          <option value="instagram">📸 Instagram</option>
          <option value="youtube">▶️ YouTube</option>
        </select>

        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={e => setScheduledFor(e.target.value)}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />

        <button
          onClick={save}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Save & Schedule
        </button>
      </div>
    </div>
  );
} 