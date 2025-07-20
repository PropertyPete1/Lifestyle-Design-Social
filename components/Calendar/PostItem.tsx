'use client';

import React from 'react';

interface PostItemProps {
  videoTitle: string;
  time: string;
}

const PostItem: React.FC<PostItemProps> = ({ videoTitle, time }) => {
  return (
    <div className="bg-gray-200 p-2 rounded-md shadow-sm text-xs mb-1">
      <p className="font-semibold">{videoTitle}</p>
      <p className="text-gray-600">{time}</p>
    </div>
  );
};

export default PostItem; 