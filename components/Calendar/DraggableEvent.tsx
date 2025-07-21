'use client';

import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';

interface DraggableEventProps {
  title: string;
  id: string;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({ title, id }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'event',
    item: { id, title },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <div
      ref={ref}
      className={`cursor-move p-2 rounded-md shadow-md text-sm ${
        isDragging ? 'opacity-40' : 'bg-white'
      }`}
    >
      {title}
    </div>
  );
};

export default DraggableEvent; 