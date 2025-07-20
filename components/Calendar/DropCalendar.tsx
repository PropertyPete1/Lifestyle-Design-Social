'use client';

import { useDrop } from 'react-dnd';
import { FC } from 'react';

interface DropCalendarProps {
  onDropEvent: (item: any, date: string) => void;
  date: string;
}

const DropCalendar: FC<DropCalendarProps> = ({ onDropEvent, date }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'event',
    drop: (item: any) => onDropEvent(item, date),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border rounded-md p-4 min-h-[100px] ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      <p className="text-xs text-gray-500 mb-2">{date}</p>
      {/* You can map and display scheduled posts here */}
    </div>
  );
};

export default DropCalendar; 