export default function QueueStatus({
  cartoonRemaining,
  totalQueued,
}: {
  cartoonRemaining: number;
  totalQueued: number;
}) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div>📼 Total Queued: {totalQueued}</div>
      <div>🎨 Cartoon Slots Left: {cartoonRemaining}</div>
    </div>
  );
} 