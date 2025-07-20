import React from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarHeader() {
  return (
    <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-300 border-b border-gray-700">
      {daysOfWeek.map((day) => (
        <div key={day} className="p-2">
          {day}
        </div>
      ))}
    </div>
  );
} 