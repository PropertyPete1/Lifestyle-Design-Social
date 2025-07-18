'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SchedulerEditPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const [datetime, setDatetime] = useState('')

  const saveChange = async () => {
    await fetch('/api/scheduler/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, scheduledFor: datetime }),
    })
    router.push('/scheduler')
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">✏️ Edit Scheduled Time</h1>
      <input
        type="datetime-local"
        className="p-2 border w-full"
        value={datetime}
        onChange={(e) => setDatetime(e.target.value)}
      />
      <button
        onClick={saveChange}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  )
} 