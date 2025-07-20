'use client';
import { useState } from 'react';

export default function DropboxSyncPage() {
  const [status, setStatus] = useState('');

  const syncNow = async () => {
    setStatus('Syncing...');
    const res = await fetch('/api/dropbox/sync');
    const data = await res.json();
    setStatus(`Synced ${data.count} videos`);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dropbox Sync</h1>
      <button
        onClick={syncNow}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sync Now
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
} 