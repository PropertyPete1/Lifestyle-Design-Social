'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type AuthContextType = {
  isAuthed: boolean
  setAuthed: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  setAuthed: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setAuthed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          setAuthed(false)
          if (pathname !== '/login') router.push('/login')
        } else {
          setAuthed(true)
        }
      })
  }, [pathname, router])

  return (
    <AuthContext.Provider value={{ isAuthed, setAuthed }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 