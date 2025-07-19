'use client'

import { useState } from 'react'

export default function UploadForm() {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('video', file)
    formData.append('caption', caption)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setStatus('Uploaded!')
      setFile(null)
      setCaption('')
    } else {
      setStatus('Failed to upload')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-neutral-800 file:text-white hover:file:bg-neutral-700"
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Enter caption..."
        className="w-full h-24 p-2 text-sm bg-neutral-800 text-white rounded"
      />
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
        Upload Video
      </button>
      {status && <p className="text-sm text-green-400">{status}</p>}
    </form>
  )
} 