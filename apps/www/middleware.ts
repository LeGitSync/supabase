import { NextResponse, type NextRequest } from 'next/server'
import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_MAX_AGE,
  FIRST_REFERRER_COOKIE_NAME,
  isExternalReferrer,
  serializeFirstReferrerCookie,
} from 'common/first-referrer-cookie'

export function middleware(request: NextRequest) {
  // If the first-referrer cookie is already set, skip — write-once behavior
  if (request.cookies.has(FIRST_REFERRER_COOKIE_NAME)) {
    return NextResponse.next()
  }

  const referrer = request.headers.get('referer') ?? ''

  // Only stamp the cookie when the referrer is external
  if (!isExternalReferrer(referrer)) {
    return NextResponse.next()
  }

  const data = buildFirstReferrerData({
    referrer,
    landingUrl: request.url,
  })

  const response = NextResponse.next()

  response.cookies.set(
    FIRST_REFERRER_COOKIE_NAME,
    serializeFirstReferrerCookie(data),
    {
      path: '/',
      sameSite: 'lax',
      // Set domain to supabase.com in production so the cookie is readable from studio
      ...(request.nextUrl.hostname === 'supabase.com' ||
      request.nextUrl.hostname.endsWith('.supabase.com')
        ? { domain: 'supabase.com' }
        : {}),
      maxAge: FIRST_REFERRER_COOKIE_MAX_AGE,
    }
  )

  return response
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|__nextjs).*)',
  ],
}
