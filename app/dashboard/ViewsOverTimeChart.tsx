'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
ChartJS.register(LineElement, CategoryScale, LinearScale, Tooltip);

interface Props {
  viewsOverTime: { date: string; views: number }[];
}

export const ViewsOverTimeChart: React.FC<Props> = ({ viewsOverTime }) => {
  const labels = viewsOverTime.map(v => new Date(v.date).toLocaleDateString());
  const data = viewsOverTime.map(v => v.views);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Views',
        data,
        borderColor: '#10B981',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl mt-4">
      <h4 className="text-white text-lg mb-2">📊 Views Over Time</h4>
      <Line data={chartData} />
    </div>
  );
}; 