import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';

type Props = {
  dates: string[];
};

export default function QueueCalendar({ dates }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5" />
        Queue Calendar
      </h3>
      <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-400">
        {Array.from({ length: 31 }).map((_, i) => {
          const day = i + 1;
          const isActive = dates.includes(String(day));
          return (
            <div
              key={day}
              className={`p-2 rounded-full ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
} 