'use client';
import { useState } from 'react';

export function DropboxSyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleClick = async () => {
    setSyncing(true);
    await fetch('/api/dropbox/sync');
    setSyncing(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={syncing}
      className="bg-indigo-600 text-white px-3 py-2 rounded disabled:opacity-50"
    >
      {syncing ? 'Syncing…' : 'Sync Dropbox'}
    </button>
  );
} 