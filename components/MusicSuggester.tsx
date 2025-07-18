"use client";
import { useState } from "react";

export default function MusicSuggester() {
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");

  const generate = async () => {
    const res = await fetch("/api/video/generate-music", {
      method: "POST",
      body: JSON.stringify({ caption }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setMusic(data.music || "No suggestions returned");
  };

  return (
    <div>
      <h2 className="font-semibold">🎵 Music Suggester</h2>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Enter caption to suggest music"
        className="border px-2 py-1 rounded w-full"
      />
      <button onClick={generate} className="mt-2 bg-purple-600 text-white px-4 py-1 rounded">
        Suggest Music
      </button>
      <p className="mt-2 italic">{music}</p>
    </div>
  );
} 