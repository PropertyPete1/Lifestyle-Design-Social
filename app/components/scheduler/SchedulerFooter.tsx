import React from 'react';

type SchedulerFooterProps = {
  scheduledCount: number;
  onConfirmSchedule: () => void;
};

export default function SchedulerFooter({
  scheduledCount,
  onConfirmSchedule,
}: SchedulerFooterProps) {
  return (
    <div className="mt-6 p-4 bg-zinc-900 border-t border-zinc-700 flex items-center justify-between">
      <p className="text-sm text-gray-300">
        {scheduledCount > 0
          ? `${scheduledCount} post${scheduledCount > 1 ? 's' : ''} scheduled`
          : 'No posts scheduled'}
      </p>
      <button
        onClick={onConfirmSchedule}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
        disabled={scheduledCount === 0}
      >
        Confirm Schedule
      </button>
    </div>
  );
} 