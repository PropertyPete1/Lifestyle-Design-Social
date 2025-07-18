'use client'

import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthed) {
      router.push('/login')
    }
  }, [isAuthed, router])

  if (!isAuthed) return null

  return <>{children}</>
} 