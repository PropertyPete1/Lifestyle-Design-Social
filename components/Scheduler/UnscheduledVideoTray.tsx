import React from 'react';
import { Video } from '../../types';
import DraggableVideoCard from './DraggableVideoCard';

interface Props {
  videos: Video[];
}

const UnscheduledVideoTray: React.FC<Props> = ({ videos }) => {
  return (
    <div className="mt-6 p-4 border border-gray-300 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Unscheduled Videos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {videos.map((video) => (
          <DraggableVideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default UnscheduledVideoTray; 