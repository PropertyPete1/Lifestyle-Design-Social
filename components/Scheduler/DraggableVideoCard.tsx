import React from 'react';
import { useDrag } from 'react-dnd';
import { Video } from '@/types';

interface Props {
  video: Video;
}

const DraggableVideoCard: React.FC<Props> = ({ video }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'VIDEO',
    item: video,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-2 border rounded-md shadow-sm bg-zinc-800 hover:bg-zinc-700 cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      🎥 {video.caption?.slice(0, 40) || 'Untitled'}
    </div>
  );
};

export default DraggableVideoCard; 