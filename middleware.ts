import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Laisser passer les crons et APIs
  if (request.nextUrl.pathname.startsWith('/api/cron/') || 
      request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Vérifier si connecté
  const accessCookie = request.cookies.get('secret_access')
  if (accessCookie?.value === 'motdepasse') {
    return NextResponse.next()
  }
  
  // Rediriger vers login
  if (request.nextUrl.pathname !== '/secret-login') {
    return NextResponse.redirect(new URL('/secret-login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}