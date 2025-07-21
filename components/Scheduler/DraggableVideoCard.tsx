import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Video } from '../../types';

interface Props {
  video: Video;
}

const DraggableVideoCard: React.FC<Props> = ({ video }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'video',
    item: { id: video.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <div
      ref={ref}
      className={`p-2 border rounded-md shadow-sm bg-zinc-800 hover:bg-zinc-700 cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      🎥 {video.title || video.caption?.slice(0, 40) || 'Untitled'}
    </div>
  );
};

export default DraggableVideoCard; 