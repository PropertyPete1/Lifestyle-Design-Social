'use client';
import { useState } from 'react';
import { updateHashtags } from '../utils/updateHashtags';

export default function TrendingHashtagManager({
  caption,
  onUpdate,
}: {
  caption: string;
  onUpdate: (updated: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const updated = await updateHashtags(caption);
    onUpdate(updated);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? 'Optimizing...' : 'Auto-Replace Hashtags'}
    </button>
  );
} 