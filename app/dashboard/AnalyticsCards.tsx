import React from 'react';

interface Props {
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
}

export const AnalyticsCards: React.FC<Props> = ({ totalPosts, successfulPosts, failedPosts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      <div className="bg-gray-900 p-4 rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total Posts</p>
        <h3 className="text-white text-2xl font-bold">{totalPosts}</h3>
      </div>
      <div className="bg-green-900 p-4 rounded-xl text-center">
        <p className="text-gray-400 text-sm">Successful</p>
        <h3 className="text-white text-2xl font-bold">{successfulPosts}</h3>
      </div>
      <div className="bg-red-900 p-4 rounded-xl text-center">
        <p className="text-gray-400 text-sm">Failed</p>
        <h3 className="text-white text-2xl font-bold">{failedPosts}</h3>
      </div>
    </div>
  );
}; 