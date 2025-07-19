'use client';

import ProtectedPage from '@/components/ProtectedPage'
import Header from '@/components/Header'
import UploadForm from '@/components/UploadForm'

export default function UploadPage() {
  return (
    <ProtectedPage>
      <Header />
      <main className="p-4">
        <h2 className="text-xl font-semibold mb-4">Upload New Video</h2>
        <UploadForm />
      </main>
    </ProtectedPage>
  )
} 