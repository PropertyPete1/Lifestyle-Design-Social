'use client';

import { useState, useEffect } from 'react';

interface PromptSelectorProps {
  onSelect: (prompt: string) => void;
}

export default function PromptSelector({ onSelect }: { onSelect: (val: string) => void }) {
  const [prompts, setPrompts] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/cartoon/prompts')
      .then((res) => res.json())
      .then((data) => setPrompts(data.prompts || []));
  }, []);

  return (
    <select onChange={(e) => onSelect(e.target.value)} className="p-2 rounded bg-gray-700 text-white w-full">
      <option value="">Select a cartoon prompt...</option>
      {prompts.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
} 