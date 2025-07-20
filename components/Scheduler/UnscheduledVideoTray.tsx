import React from 'react';
import { Video } from '@/types';
import DraggableVideoCard from './DraggableVideoCard';

interface Props {
  videos: Video[];
}

const UnscheduledVideoTray: React.FC<Props> = ({ videos }) => {
  return (
    <div className="bg-zinc-900 p-4 rounded-lg shadow-md mt-4">
      <h3 className="text-lg font-bold mb-2 text-white">Unscheduled Videos</h3>
      <div className="flex gap-3 flex-wrap">
        {videos.map((video) => (
          <DraggableVideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default UnscheduledVideoTray; 