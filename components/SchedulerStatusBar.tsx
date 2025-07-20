export default function SchedulerStatusBar({ time }: { time: string }) {
  return (
    <div className="w-full bg-gray-900 text-white px-4 py-3 mt-6 rounded-lg border border-gray-700">
      <p className="text-sm">📅 Next scheduled post: <span className="font-medium">{time}</span></p>
    </div>
  );
} 