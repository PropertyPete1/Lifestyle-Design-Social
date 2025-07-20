'use client';

import React from 'react';
import PostItem from './PostItem';

interface ScheduledEventsViewerProps {
  events: {
    id: string;
    title: string;
    date: string;
  }[];
  date: string;
}

const ScheduledEventsViewer: React.FC<ScheduledEventsViewerProps> = ({
  events,
  date,
}) => {
  const filtered = events.filter((e) => e.date === date);

  return (
    <div className="mt-2">
      {filtered.map((e) => (
        <PostItem key={e.id} videoTitle={e.title} time="10:00 AM" />
      ))}
    </div>
  );
};

export default ScheduledEventsViewer; 