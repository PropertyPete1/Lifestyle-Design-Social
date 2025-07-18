'use client'

import { useDrag } from 'react-dnd'
import { VideoItem } from '@/types'
import React from 'react'

interface Props {
  video: VideoItem
}

export default function VideoItem({ video }: Props) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'VIDEO',
    item: video,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`p-2 mb-2 rounded-md border shadow text-xs ${
        isDragging ? 'opacity-30' : 'bg-gray-50'
      }`}
    >
      <p className="font-medium truncate">{video.title}</p>
      <p className="text-gray-400 text-[10px]">{video.platform}</p>
    </div>
  )
} 