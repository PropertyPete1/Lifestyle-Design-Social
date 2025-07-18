'use client'

import { useDrop } from 'react-dnd'
import { VideoItem } from '@/types'
import React from 'react'

interface TimeSlotProps {
  time: string
  onDropVideo: (time: string, video: VideoItem) => void
}

export default function TimeSlot({ time, onDropVideo }: TimeSlotProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'VIDEO',
    drop: (item: VideoItem) => {
      onDropVideo(time, item)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={`border px-2 py-4 h-20 cursor-pointer text-sm ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      <div className="text-gray-500">{time}</div>
    </div>
  )
} 