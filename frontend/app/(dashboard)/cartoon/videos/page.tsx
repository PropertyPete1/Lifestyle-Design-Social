'use client'

import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CartoonVideoListPage() {
  const { data, error, isLoading } = useSWR('/api/cartoon/list', fetcher)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error loading videos.</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🎬 Your Cartoon Videos</h1>
      <div className="space-y-4">
        {data?.map((video: any) => (
          <div key={video._id} className="p-4 border rounded space-y-2">
            <video src={video.videoUrl} controls className="w-full rounded" />
            <div className="text-sm text-gray-700">Prompt: {video.prompt}</div>
            <div className="text-sm text-gray-500">Aspect Ratio: {video.aspectRatio}</div>
            <div className="text-sm text-green-600">
              Scheduled: {video.scheduledFor ? new Date(video.scheduledFor).toLocaleString() : 'Not scheduled'}
            </div>
            <Link
              href={`/cartoon/schedule?id=${video._id}`}
              className="inline-block mt-2 text-blue-600 underline text-sm"
            >
              📅 Schedule or Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 