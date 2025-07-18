"use client";
import { useState } from "react";

export default function HashtagGenerator() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const generate = async () => {
    const res = await fetch("/api/video/generate-hashtags", {
      method: "POST",
      body: JSON.stringify({ caption }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setHashtags(data.hashtags || "No hashtags returned");
  };

  return (
    <div>
      <h2 className="font-semibold">🏷️ Generate Hashtags</h2>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Paste your caption here"
        className="border px-2 py-1 rounded w-full"
      />
      <button onClick={generate} className="mt-2 bg-green-600 text-white px-4 py-1 rounded">
        Get Hashtags
      </button>
      <p className="mt-2 italic">{hashtags}</p>
    </div>
  );
} 