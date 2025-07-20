'use client';

import React from 'react';
import DropCalendar from './DropCalendar';

const CalendarGrid = ({ onDropEvent }: any) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {days.map((date) => (
        <DropCalendar key={date} date={date} onDropEvent={onDropEvent} />
      ))}
    </div>
  );
};

export default CalendarGrid; 