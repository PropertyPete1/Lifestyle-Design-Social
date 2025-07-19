'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button onClick={handleLogout} className="bg-white text-black px-4 py-2 rounded">
      Logout
    </button>
  )
} 