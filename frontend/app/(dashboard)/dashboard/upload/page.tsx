'use client';

import { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      setFile(event.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await fetch('http://localhost:5000/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert('Upload success: ' + data.url);
      setFile(null);
    } catch (error) {
      alert('Upload failed.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="text-white">
        <h2 className="text-xl font-bold mb-4">Upload a Video</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-brand rounded-lg p-12 text-center cursor-pointer transition hover:bg-[#222]"
        >
          {file ? (
            <p>{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          ) : (
            <p>Drag and drop your video here</p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 bg-brand text-black px-6 py-2 rounded font-bold hover:opacity-90"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
    </ProtectedRoute>
  );
} 