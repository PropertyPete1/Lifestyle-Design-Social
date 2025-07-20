'use client';

import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableEventProps {
  title: string;
  id: string;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({ title, id }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'event',
    item: { id, title },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`cursor-move p-2 rounded-md shadow-md text-sm ${
        isDragging ? 'opacity-40' : 'bg-white'
      }`}
    >
      {title}
    </div>
  );
};

export default DraggableEvent; 