'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SchedulerPage() {
  const { data, error, isLoading } = useSWR('/api/scheduler/list', fetcher)
  const [filter, setFilter] = useState('all')

  if (isLoading) return <p>Loading scheduler...</p>
  if (error) return <p>Failed to load scheduled posts.</p>

  const filtered = data.filter((item: any) =>
    filter === 'all' ? true : item.platform === filter
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📅 Scheduled Content</h1>

      <div className="mb-6 flex gap-2 text-sm">
        {['all', 'instagram', 'tiktok', 'youtube'].map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1 rounded border ${
              filter === opt ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            {opt.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item: any) => {
          const scheduledDate = new Date(item.scheduledFor)
          const now = new Date()
          const timeDiffHours =
            (scheduledDate.getTime() - now.getTime()) / 1000 / 60 / 60

          const isSoon = timeDiffHours > 0 && timeDiffHours <= 6

          return (
            <div key={item._id} className="p-4 border rounded">
              <div className="text-xs uppercase text-gray-500 flex justify-between">
                <span>{item.platform} – {scheduledDate.toLocaleString()}</span>
                {isSoon && <span className="text-orange-500">⚠️ Posting Soon</span>}
              </div>
              <video src={item.videoUrl} controls className="mt-2 w-full rounded" />
              <div className="text-sm mt-2 text-gray-700">{item.caption}</div>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/scheduler/edit?id=${item._id}`}
                  className="text-blue-600 text-sm underline"
                >
                  ✏️ Edit
                </Link>
                <Link
                  href={`/scheduler/delete?id=${item._id}`}
                  className="text-red-600 text-sm underline"
                >
                  ❌ Delete
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 