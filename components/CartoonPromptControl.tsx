'use client';

import { useEffect, useState } from 'react';

export default function CartoonPromptControl() {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/cartoon/prompts')
      .then(res => res.json())
      .then(data => setPrompts(data.prompts))
      .catch(err => setMessage({ type: 'error', text: 'Failed to load prompts' }));
  }, []);

  const addPrompt = async () => {
    if (!newPrompt.trim()) return;
    
    const res = await fetch('/api/cartoon/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: newPrompt }),
    });
    const data = await res.json();
    if (res.ok) {
      setPrompts(data.prompts);
      setNewPrompt('');
      setMessage({ type: 'success', text: 'Prompt added!' });
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to add prompt' });
    }
  };

  const deletePrompt = async (prompt: string) => {
    const res = await fetch('/api/cartoon/prompts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (res.ok) {
      setPrompts(data.prompts);
      setMessage({ type: 'success', text: 'Prompt deleted' });
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to delete prompt' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="float-right text-xs hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Prompt Form */}
      <div className="flex gap-2 mb-4">
        <input
          className="bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full"
          value={newPrompt}
          onChange={e => setNewPrompt(e.target.value)}
          placeholder="Enter new cartoon style prompt"
          onKeyPress={(e) => e.key === 'Enter' && addPrompt()}
        />
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-medium transition-colors"
          onClick={addPrompt}
        >
          Add
        </button>
      </div>

      {/* Prompts List */}
      <div className="space-y-2">
        {prompts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No prompts added yet. Add your first cartoon prompt above.</p>
        ) : (
          prompts.map((prompt, index) => (
            <div key={index} className="flex justify-between items-center bg-zinc-800 p-3 rounded-md border border-zinc-700">
              <span className="text-white flex-1">{prompt}</span>
              <button
                className="text-red-400 hover:text-red-300 ml-3 px-2 py-1 rounded text-sm font-medium transition-colors"
                onClick={() => deletePrompt(prompt)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 