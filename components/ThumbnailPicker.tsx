"use client";
import { useState } from "react";

export default function ThumbnailPicker() {
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const generate = async () => {
    const res = await fetch("/api/video/generate-thumbnail", {
      method: "POST",
      body: JSON.stringify({ videoUrl }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setThumbnailUrl(data.thumbnailUrl || "");
  };

  return (
    <div>
      <h2 className="font-semibold">🖼️ Thumbnail Picker</h2>
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Enter video URL"
        className="border px-2 py-1 rounded w-full"
      />
      <button onClick={generate} className="mt-2 bg-indigo-500 text-white px-4 py-1 rounded">
        Generate Thumbnail
      </button>
      {thumbnailUrl && (
        <div className="mt-2">
          <img src={thumbnailUrl} alt="Generated thumbnail" className="w-full rounded" />
        </div>
      )}
    </div>
  );
} 