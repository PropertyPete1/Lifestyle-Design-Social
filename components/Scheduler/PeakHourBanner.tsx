import React from 'react';

interface Props {
  peakHours: number[];
}

const PeakHourBanner: React.FC<Props> = ({ peakHours }) => {
  if (!peakHours || peakHours.length === 0) return null;

  return (
    <div className="bg-emerald-800 text-white p-4 rounded-lg text-sm mt-2 flex items-center space-x-2">
      <span role="img" aria-label="chart">📈</span>
      <span>
        Based on your viewers’ behavior, ideal posting times:
        <span className="font-semibold ml-1">
          {peakHours.map((h, i) => (
            <span key={h}>
              {h}:00{(i < peakHours.length - 1) ? ', ' : ''}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
};

export default PeakHourBanner; 