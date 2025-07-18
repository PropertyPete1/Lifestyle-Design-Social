'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/12345'); // TODO: Replace with real user ID
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p className="text-white">Loading analytics...</p>;
  if (!data) return <p className="text-red-500">Failed to load analytics.</p>;

  return (
    <ProtectedRoute>
      <div className="text-white">
        <h2 className="text-xl font-bold mb-6">📊 Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Posts" value={data.totalPosts} />
          <StatCard title="Posted" value={data.posted} />
          <StatCard title="Failed" value={data.failed} />
          <StatCard title="Pending" value={data.pending} />
          <StatCard title="Success Rate" value={(data.successRate * 100).toFixed(1) + '%'} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-sm uppercase text-gray-400 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-brand">{value}</p>
    </div>
  );
} 