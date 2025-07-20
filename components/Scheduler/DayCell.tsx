import React from 'react';
import { useDrop } from 'react-dnd';
import ScheduledPostCard from './ScheduledPostCard';
import { useCalendar } from './CalendarContext';

type Props = {
  index: number;
};

export default function DayCell({ index }: Props) {
  const { assignments, assignPost } = useCalendar();

  const [{ isOver }, drop] = useDrop({
    accept: 'POST',
    drop: (item: any) => {
      assignPost(index, { id: item.id, title: `Post ${item.id}` });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const posts = assignments[index] || [];

  return (
    <div
      ref={drop}
      className={`p-2 border border-gray-600 min-h-[100px] ${
        isOver ? 'bg-green-700' : 'bg-gray-800'
      }`}
    >
      {posts.map((post) => (
        <ScheduledPostCard key={post.id} post={post} />
      ))}
    </div>
  );
} 