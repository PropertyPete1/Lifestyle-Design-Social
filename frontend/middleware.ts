import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware() {
  // Future: add edge protection here.
}

export const config = {
  matcher: ['/dashboard'],
}; 