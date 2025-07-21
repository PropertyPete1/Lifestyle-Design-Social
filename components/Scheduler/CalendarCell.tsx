import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Video } from '../../types';

interface Props {
  date: string;
  videos: Video[];
  onVideoDrop: (videoId: string, date: string) => void;
}

const CalendarCell: React.FC<Props> = ({ date, videos, onVideoDrop }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'video',
    drop: (item: { id: string }) => onVideoDrop(item.id, date),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`p-2 border border-gray-300 min-h-[100px] ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      <div className="text-sm font-medium mb-2">{date}</div>
      <div className="space-y-1">
        {videos.map((video) => (
          <div
            key={video.id}
            className="p-1 bg-blue-500 text-white text-xs rounded truncate"
          >
            {video.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarCell; 