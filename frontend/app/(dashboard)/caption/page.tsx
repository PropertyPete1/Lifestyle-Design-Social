'use client'

import { useState } from 'react'

export default function CaptionPage() {
  const [prompt, setPrompt] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    const res = await fetch('/api/caption/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    setCaption(data.caption)
    setHashtags(data.hashtags)
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">🧠 AI Caption & Hashtag Generator</h1>
      <input
        className="w-full border p-2"
        placeholder="Describe the scene (e.g. luxury kitchen with gold finishes)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={generate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Caption'}
      </button>

      {caption && (
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-600">Caption</p>
          <p className="border p-3 rounded text-sm">{caption}</p>
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-600">Hashtags</p>
          <p className="border p-3 rounded text-sm">{hashtags.join(' ')}</p>
        </div>
      )}
    </div>
  )
} 