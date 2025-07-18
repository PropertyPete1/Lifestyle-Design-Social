export default function CaptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <a href="/caption" className="text-sm text-blue-600 underline">Generate</a>
        <a href="/caption/history" className="text-sm text-blue-600 underline">History</a>
      </div>
      {children}
    </div>
  )
} 