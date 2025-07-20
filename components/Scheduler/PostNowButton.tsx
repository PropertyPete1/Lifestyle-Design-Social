import React from 'react';

interface Props {
  currentHour: number;
  peakHours: number[];
  onPost: () => void;
}

const PostNowButton: React.FC<Props> = ({ currentHour, peakHours, onPost }) => {
  const isPeak = peakHours.includes(currentHour);

  return (
    <button
      onClick={onPost}
      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
        isPeak ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-black hover:bg-gray-400'
      }`}
    >
      {isPeak ? '🚀 Post Now (Peak Hour)' : 'Post Now'}
    </button>
  );
};

export default PostNowButton; 