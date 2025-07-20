'use client';

import React, { useEffect, useState } from 'react';
import { Video } from '@/types';
import { groupVideosByDate } from '@/lib/scheduler/schedulerHelpers';
import CalendarCell from '@/components/Scheduler/CalendarCell';
import UnscheduledVideoTray from '@/components/Scheduler/UnscheduledVideoTray';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function SchedulerPage() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetch('/api/scheduler/schedule')
      .then((res) => res.json())
      .then(setVideos);
  }, []);

  const handleDrop = (video: Video, date: string) => {
    const updated = videos.map((v) =>
      v.id === video.id ? { ...v, scheduledDate: date } : v
    );
    setVideos(updated);
  };

  const grouped = groupVideosByDate(videos);
  const dates = Object.keys(grouped).filter((d) => d !== 'Unscheduled');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-white">📅 Post Scheduler</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dates.map((date) => (
            <CalendarCell
              key={date}
              date={date}
              videos={grouped[date]}
              onDrop={handleDrop}
            />
          ))}
        </div>
        <UnscheduledVideoTray videos={grouped['Unscheduled'] || []} />
      </div>
    </DndProvider>
  );
} 