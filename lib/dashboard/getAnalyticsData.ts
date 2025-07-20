export async function getAnalyticsData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
} 