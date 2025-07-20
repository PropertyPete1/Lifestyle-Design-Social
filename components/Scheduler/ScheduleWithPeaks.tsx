import React from 'react';
import { usePeakHours } from '../../hooks/usePeakHours';
import PeakHourBanner from './PeakHourBanner';

interface Props {
  userId: string;
}

const ScheduleWithPeaks: React.FC<Props> = ({ userId }) => {
  const { peakHours, loading, error } = usePeakHours(userId);

  return (
    <div>
      {loading && <div className="text-gray-500 text-sm mb-2">Loading peak hours...</div>}
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {peakHours && <PeakHourBanner peakHours={peakHours} />}
      {/* Existing calendar grid goes here */}
    </div>
  );
};

export default ScheduleWithPeaks; 