'use client';
import { useState } from 'react';

export default function DropboxSyncCard() {
  const [status, setStatus] = useState('Idle');

  const syncNow = async () => {
    setStatus('Syncing...');
    const res = await fetch('/api/dropbox/sync');
    const data = await res.json();
    setStatus(`✅ Synced ${data.count} videos`);
  };

  return (
    <div className="border p-4 rounded shadow">
      <h3 className="font-semibold text-lg mb-2">Dropbox Sync</h3>
      <button
        onClick={syncNow}
        className="bg-blue-500 text-white px-4 py-1 rounded"
      >
        Sync Now
      </button>
      <p className="text-sm mt-2">{status}</p>
    </div>
  );
} 