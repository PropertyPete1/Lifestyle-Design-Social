import React from 'react';
import DayCell from './DayCell';

export default function CalendarGrid() {
  const days = Array.from({ length: 42 }); // 6 weeks grid

  return (
    <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-700">
      {days.map((_, index) => (
        <DayCell key={index} index={index} />
      ))}
    </div>
  );
} 