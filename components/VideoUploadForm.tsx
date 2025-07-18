"use client";
import { useState } from "react";

export default function VideoUploadForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const upload = async () => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append("video", videoFile);
    const res = await fetch("/api/video/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setPreviewUrl(data.videoUrl);
  };

  return (
    <div>
      <h2 className="font-semibold">📤 Upload Video</h2>
      <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
      <button onClick={upload} className="mt-2 bg-teal-600 text-white px-4 py-1 rounded">
        Upload
      </button>
      {previewUrl && (
        <video controls className="mt-2 rounded w-full">
          <source src={previewUrl} type="video/mp4" />
        </video>
      )}
    </div>
  );
} 