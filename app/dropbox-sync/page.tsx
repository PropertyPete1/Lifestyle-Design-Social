'use client';
import { useState } from 'react';

export default function DropboxSyncPage() {
  const [status, setStatus] = useState('');

  const syncNow = async () => {
    setStatus('Syncing...');
    const res = await fetch('/api/dropbox/sync');
    const data = await res.json();
    setStatus(`Synced ${data.count} videos.`);
  };

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Sync from Dropbox</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={syncNow}
      >
        Sync Now
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
} 