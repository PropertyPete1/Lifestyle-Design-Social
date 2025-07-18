"use client";
import { useState } from "react";

export default function CaptionGenerator() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const generate = async () => {
    const res = await fetch("/api/video/generate-caption", {
      method: "POST",
      body: JSON.stringify({ videoTitle: title }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setCaption(data.caption || "No caption returned");
  };

  return (
    <div>
      <h2 className="font-semibold">🎬 Generate Caption</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter video title"
        className="border px-2 py-1 rounded"
      />
      <button onClick={generate} className="ml-2 bg-blue-500 text-white px-4 py-1 rounded">
        Generate
      </button>
      <p className="mt-2 italic">{caption}</p>
    </div>
  );
} 