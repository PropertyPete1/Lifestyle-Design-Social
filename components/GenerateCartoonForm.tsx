'use client';

import { useState } from 'react';
import PromptSelector from './PromptSelector';

export default function GenerateCartoonForm() {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedPrompt) {
      setError('Please select a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/cartoon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedPrompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate cartoon');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Generate Cartoon Video</h2>
        <p className="text-gray-400 text-sm mb-4">
          Select a prompt and generate a cartoon video from your uploaded content.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Prompt
          </label>
          <PromptSelector onSelect={setSelectedPrompt} />
        </div>

        {selectedPrompt && (
          <div className="bg-zinc-800 p-3 rounded-md border border-zinc-700">
            <p className="text-sm text-gray-400 mb-1">Selected Prompt:</p>
            <p className="text-white">{selectedPrompt}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedPrompt}
          className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
            loading || !selectedPrompt
              ? 'bg-zinc-600 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </div>
          ) : (
            'Generate Cartoon'
          )}
        </button>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-md border border-red-500/30">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-500/20 text-green-400 p-4 rounded-md border border-green-500/30">
            <h3 className="font-semibold mb-2">Cartoon Generated Successfully!</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {result.status}</p>
              {result.videoUrl && (
                <p><strong>Video URL:</strong> {result.videoUrl}</p>
              )}
              {result.message && (
                <p><strong>Message:</strong> {result.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 