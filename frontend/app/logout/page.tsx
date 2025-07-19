'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/logout', { method: 'POST' }).then(() => {
      router.push('/login')
    })
  }, [router])

  return <p className="text-white p-4">Logging out...</p>
} 