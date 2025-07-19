import Header from '@/app/components/Header'
import UploadForm from '@/app/components/UploadForm'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Upload New Video</h1>
        <UploadForm />
      </main>
    </div>
  )
} 