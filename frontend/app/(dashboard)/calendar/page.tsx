import Header from '@/app/components/Header'
import VideoList from '@/app/components/VideoList'

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-3xl mx-auto py-10">
        <h1 className="text-white text-2xl font-bold mb-4">Scheduled Posts</h1>
        <VideoList />
      </main>
    </div>
  )
} 