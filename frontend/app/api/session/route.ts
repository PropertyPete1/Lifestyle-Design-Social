'use server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = cookies().get('session')

  return NextResponse.json({
    loggedIn: !!session,
  })
} 