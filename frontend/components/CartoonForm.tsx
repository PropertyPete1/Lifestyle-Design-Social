'use client'
import { useState } from 'react'

export default function CartoonForm() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const generateCartoon = async () => {
    setLoading(true)
    const res = await fetch('/api/cartoon/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspect }),
    })
    const data = await res.json()
    setVideoUrl(data.url)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <input
        className="w-full p-2 border"
        placeholder="Describe the cartoon scene (e.g. luxury kitchen walkthrough)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <select className="p-2 border" value={aspect} onChange={(e) => setAspect(e.target.value)}>
        <option value="16:9">Landscape (YouTube)</option>
        <option value="9:16">Portrait (Instagram/TikTok)</option>
        <option value="1:1">Square</option>
      </select>
      <button
        className="bg-black text-white px-4 py-2 rounded"
        disabled={loading}
        onClick={generateCartoon}
      >
        {loading ? 'Generating...' : 'Generate Cartoon'}
      </button>
      {videoUrl && (
        <video src={videoUrl} controls className="w-full mt-4 rounded" />
      )}
    </div>
  )
} 