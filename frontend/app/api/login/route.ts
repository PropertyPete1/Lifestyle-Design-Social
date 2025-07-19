'use server'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    cookies().set('auth', 'true', {
      httpOnly: true,
      path: '/',
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false }, { status: 401 })
} 