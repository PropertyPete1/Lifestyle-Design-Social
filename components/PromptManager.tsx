'use client';

import { useState, useEffect } from 'react';

export default function PromptManager() {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    fetch('/api/cartoon/prompts')
      .then((res) => res.json())
      .then((data) => setPrompts(data.prompts || []));
  }, []);

  const handleAdd = async () => {
    if (!newPrompt) return;
    const res = await fetch('/api/cartoon/prompts', {
      method: 'POST',
      body: JSON.stringify({ prompt: newPrompt }),
      headers: { 'Content-Type': 'application/json' },
    });
    const updated = await res.json();
    setPrompts(updated.prompts || []);
    setNewPrompt('');
  };

  const handleDelete = async (prompt: string) => {
    const res = await fetch('/api/cartoon/prompts', {
      method: 'DELETE',
      body: JSON.stringify({ prompt }),
      headers: { 'Content-Type': 'application/json' },
    });
    const updated = await res.json();
    setPrompts(updated.prompts || []);
  };

  useEffect(() => {
    fetch('/api/cartoon/prompts')
      .then((res) => res.json())
      .then((data) => setPrompts(data.prompts || []));
  }, []);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-white mb-2">🧠 Manage Prompts</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          className="px-2 py-1 rounded text-black flex-1"
          placeholder="Enter new prompt"
        />
        <button onClick={handleAdd} className="bg-green-600 px-3 py-1 rounded text-white">
          Add
        </button>
      </div>
      <ul className="list-disc list-inside text-white space-y-1">
        {prompts.map((p) => (
          <li key={p} className="flex justify-between items-center">
            <span>{p}</span>
            <button onClick={() => handleDelete(p)} className="text-red-400 text-sm ml-2">🗑 Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
} 