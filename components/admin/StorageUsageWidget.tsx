'use client';

import { useEffect, useState } from 'react';

interface StorageData {
  usageBytes: number;
  usageFormatted: string;
}

export default function StorageUsageWidget() {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('/api/storage/usage');
        if (!res.ok) {
          throw new Error('Failed to fetch storage data');
        }
        
        const data = await res.json();
        setStorageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storage data');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  const getUsageColor = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb > 80) return 'text-red-400';
    if (gb > 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 p-4 rounded-md text-white">
        <h2 className="text-lg font-semibold mb-2">S3 Storage Usage</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-24 mb-2"></div>
          <div className="h-3 bg-zinc-700 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-800 p-4 rounded-md text-white">
        <h2 className="text-lg font-semibold mb-2">S3 Storage Usage</h2>
        <p className="text-red-400 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 p-4 rounded-md text-white">
      <h2 className="text-lg font-semibold mb-2">S3 Storage Usage</h2>
      {storageData && (
        <div>
          <p className={`text-xl font-bold ${getUsageColor(storageData.usageBytes)}`}>
            {storageData.usageFormatted}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {Math.round(storageData.usageBytes / (1024 * 1024))} MB used
          </p>
        </div>
      )}
    </div>
  );
} 