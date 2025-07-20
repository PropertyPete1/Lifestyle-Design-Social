'use client';
import { useState } from 'react';

interface Props {
  originalCaption: string;
}

export default function EnhancedCaptionPreview({ originalCaption }: Props) {
  const [enhanced, setEnhanced] = useState('');

  async function getEnhanced() {
    const res = await fetch('/api/caption/gpt-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: originalCaption }),
    });
    const data = await res.json();
    setEnhanced(data.enhanced);
  }

  return (
    <div className="p-4 border rounded mt-4">
      <button onClick={getEnhanced} className="text-sm text-blue-500 underline mb-2">
        Generate Enhanced Caption
      </button>
      {enhanced && <p className="text-sm text-gray-700">{enhanced}</p>}
    </div>
  );
} 