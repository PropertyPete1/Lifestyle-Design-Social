'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

interface Props {
  hashtagStats: Record<string, number>;
}

export const HashtagPerformanceChart: React.FC<Props> = ({ hashtagStats }) => {
  const labels = Object.keys(hashtagStats);
  const data = Object.values(hashtagStats);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Views by Hashtag',
        data,
        backgroundColor: '#4F46E5',
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl mt-4">
      <h4 className="text-white text-lg mb-2">📈 Hashtag Performance</h4>
      <Bar data={chartData} />
    </div>
  );
}; 