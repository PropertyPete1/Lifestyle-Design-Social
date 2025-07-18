'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();

        if (res.ok) {
          setMetrics(data);
        } else {
          setError(data.error || 'Failed to load analytics');
        }
      } catch {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📊 Analytics Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard title="Total Views" value={metrics.totalViews} />
          <MetricCard title="Total Likes" value={metrics.totalLikes} />
          <MetricCard title="Total Comments" value={metrics.totalComments} />
          <MetricCard title="Total Shares" value={metrics.totalShares} />
          <MetricCard title="Engagement Rate" value={`${metrics.engagementRate}%`} />
          <MetricCard title="Top Platform" value={metrics.topPlatform} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 p-4 rounded shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
} 