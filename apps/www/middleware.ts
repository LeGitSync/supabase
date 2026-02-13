import { NextResponse, type NextRequest } from 'next/server'
import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_MAX_AGE,
  FIRST_REFERRER_COOKIE_NAME,
  isExternalReferrer,
  serializeFirstReferrerCookie,
} from 'common/first-referrer-cookie'

export function middleware(request: NextRequest) {
  // If the first-referrer cookie is already set, skip
  if (request.cookies.has(FIRST_REFERRER_COOKIE_NAME)) return NextResponse.next()

  const referrer = request.headers.get('referer') ?? ''

  // Only stamp the cookie when the referrer is external
  if (!isExternalReferrer(referrer)) return NextResponse.next()

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
      // Use a shared domain on *.supabase.com so www/docs -> studio can read it.
      // On non-supabase hosts (localhost, previews), leave domain unset so the
      // browser stores a host-only cookie instead of rejecting an invalid domain.
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
