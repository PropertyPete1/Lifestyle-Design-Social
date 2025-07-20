import { useEffect, useState } from 'react';

export function usePeakHours(userId: string) {
  const [peakHours, setPeakHours] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPeaks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scheduler/peaks?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setPeakHours(data.peakHours);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch peak hours');
        setPeakHours(null);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchPeaks();
    else setPeakHours(null);
  }, [userId]);

  return { peakHours, loading, error };
} 