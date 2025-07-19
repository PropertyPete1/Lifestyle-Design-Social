'use server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const isAuthed = cookies().get('auth')?.value === 'true'
  return NextResponse.json({ isAuthed })
} 