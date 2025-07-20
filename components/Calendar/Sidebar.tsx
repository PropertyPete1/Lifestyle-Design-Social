'use client';

import React from 'react';
import DraggableEvent from './DraggableEvent';

const Sidebar = ({ availableVideos }: { availableVideos: any[] }) => {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm mb-2">📽️ Available Videos</h3>
      {availableVideos.map((video) => (
        <DraggableEvent
          key={video.id}
          id={video.id}
          title={video.title}
        />
      ))}
    </div>
  );
};

export default Sidebar; 