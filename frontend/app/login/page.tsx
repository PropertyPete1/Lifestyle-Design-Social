'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import React from 'react';

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Dummy login logic
    if (email && password) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 bg-zinc-800 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-zinc-800 rounded"
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">
          Sign In
        </button>
      </form>
    </div>
  )
} 