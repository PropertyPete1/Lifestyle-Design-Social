'use client'

import { useState } from 'react'
import axios from 'axios'

export default function BulkVideoUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles))
    }
  }

  const handleUpload = async () => {
    if (!files.length) return

    setUploading(true)
    setMessage('')
    setProgress(0)

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('video', files[i])

      try {
        await axios.post('/api/videos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            setProgress(percent)
          }
        })
      } catch (error) {
        console.error(`Failed to upload video: ${files[i].name}`, error)
        setMessage(`Error uploading ${files[i].name}`)
      }
    }

    setUploading(false)
    setMessage('All videos uploaded successfully.')
    setFiles([])
    setProgress(0)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">📤 Bulk Video Upload</h1>
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={uploading || !files.length}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Videos'}
      </button>

      {progress > 0 && (
        <div className="mt-2">
          <p>Progress: {progress}%</p>
        </div>
      )}

      {message && (
        <div className="mt-4 text-green-600 font-medium">
          {message}
        </div>
      )}
    </div>
  )
} 