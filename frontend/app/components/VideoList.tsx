'use client'

import { useEffect, useState } from 'react'
import { VideoMetadata } from '@/types/video'
import SchedulingCard from './SchedulingCard'

export default function VideoList() {
  const [videos, setVideos] = useState<VideoMetadata[]>([])

  useEffect(() => {
    fetch('/api/videos')
      .then((res) => res.json())
      .then((data) => setVideos(data))
  }, [])

  return (
    <div className="space-y-4">
      {videos.map((video, idx) => (
        <SchedulingCard key={idx} video={video} />
      ))}
    </div>
  )
} 