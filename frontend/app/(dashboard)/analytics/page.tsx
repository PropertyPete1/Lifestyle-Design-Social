'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR('/api/analytics', fetcher)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error loading analytics.</p>

  const totalViews = data.reduce((acc: number, item: any) => acc + item.views, 0)
  const totalLikes = data.reduce((acc: number, item: any) => acc + item.likes, 0)
  const totalComments = data.reduce((acc: number, item: any) => acc + item.comments, 0)
  const totalShares = data.reduce((acc: number, item: any) => acc + item.shares, 0)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">📊 Performance Analytics</h1>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 border rounded">Total Views: {totalViews}</div>
        <div className="p-4 border rounded">Total Likes: {totalLikes}</div>
        <div className="p-4 border rounded">Total Comments: {totalComments}</div>
        <div className="p-4 border rounded">Total Shares: {totalShares}</div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Recent Posts</h2>
        <ul className="divide-y mt-2">
          {data.map((d: any) => (
            <li key={d._id} className="py-3">
              <div className="text-sm text-gray-800 font-medium">{d.platform.toUpperCase()} – Posted: {new Date(d.postedAt).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">Views: {d.views} | Likes: {d.likes} | Comments: {d.comments} | Shares: {d.shares}</div>
              <div className="text-xs text-green-600">Engagement Rate: {(d.engagementRate * 100).toFixed(1)}%</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 