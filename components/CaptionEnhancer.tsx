'use client';
import { useState } from 'react';

export default function CaptionEnhancer() {
  const [input, setInput] = useState('');
  const [enhanced, setEnhanced] = useState('');

  async function handleEnhance() {
    const res = await fetch('/api/caption/gpt-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: input }),
    });
    const data = await res.json();
    setEnhanced(data.enhanced);
  }

  return (
    <div className="space-y-4">
      <textarea className="w-full p-2 border" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste original caption..." />
      <button onClick={handleEnhance} className="bg-blue-500 text-white px-4 py-2 rounded">Enhance Caption</button>
      {enhanced && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>Enhanced Caption:</strong>
          <p>{enhanced}</p>
        </div>
      )}
    </div>
  );
} 