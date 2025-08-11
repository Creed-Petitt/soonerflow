import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Allow auth endpoints, static files, and API routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Handle root path for authenticated users
  if (pathname === '/') {
    if (token) {
      // Check if user needs onboarding
      const needsOnboarding = token.needsOnboarding as boolean
      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Not authenticated, show login page
    return NextResponse.next()
  }

  // For all other routes, require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check onboarding status for authenticated users
  const needsOnboarding = token.needsOnboarding as boolean
  
  // Allow manual access to onboarding with ?force=true
  const forceOnboarding = request.nextUrl.searchParams.get('force') === 'true'
  
  if (forceOnboarding && pathname.startsWith('/onboarding')) {
    return NextResponse.next()
  }
  
  if (needsOnboarding && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  
  if (!needsOnboarding && pathname.startsWith('/onboarding') && !forceOnboarding) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}