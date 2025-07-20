import React from 'react';
import { useDrag } from 'react-dnd';

type Props = {
  post: { id: number; title: string };
};

export default function ScheduledPostCard({ post }: Props) {
  const [{ isDragging }, drag] = useDrag({
    type: 'POST',
    item: { id: post.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`bg-blue-600 text-white text-sm p-2 rounded shadow ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {post.title}
    </div>
  );
} 