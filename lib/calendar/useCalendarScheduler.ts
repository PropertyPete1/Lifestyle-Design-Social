'use client';

import { useState } from 'react';

interface ScheduledEvent {
  id: string;
  title: string;
  date: string;
}

export const useCalendarScheduler = () => {
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);

  const handleDropEvent = (item: any, date: string) => {
    setScheduledEvents((prev) => [...prev, { ...item, date }]);
  };

  return {
    scheduledEvents,
    handleDropEvent,
  };
}; 