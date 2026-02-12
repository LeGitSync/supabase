import { IS_PROD, LOCAL_STORAGE_KEYS } from './constants'
import { isBrowser } from './helpers'

const FIRST_TOUCH_COOKIE_KEY = 'sb-first-touch'

export function getTelemetryCookieOptions() {
  if (typeof window === 'undefined') return 'path=/; SameSite=Lax'
  if (!IS_PROD) return 'path=/; SameSite=Lax'

  const hostname = window.location.hostname
  const isSupabaseCom = hostname === 'supabase.com' || hostname.endsWith('.supabase.com')
  return isSupabaseCom ? 'path=/; domain=supabase.com; SameSite=Lax' : 'path=/; SameSite=Lax'
}

export function clearTelemetryDataCookie() {
  if (!isBrowser) return
  document.cookie = `${LOCAL_STORAGE_KEYS.TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; ${getTelemetryCookieOptions()}`
}

// ---
// First-touch referrer cookie
//
// Persists the external referrer and first-touch attribution data (UTM params,
// ad click IDs) across page navigations within supabase.com. Unlike the
// telemetry data cookie (which is cleared after the initial pageview), this
// cookie survives until the user is identified so it can be used to:
//  1. Override posthog-js's auto-detected $initial_referrer (which would
//     otherwise be the internal supabase.com referrer on the dashboard)
//  2. Provide correct $referrer for the dashboard's initial pageview when
//     the telemetry data cookie was already consumed on www
// ---

export interface FirstTouchData {
  referrer: string
  referring_domain: string
  page_url: string
}

export function isExternalReferrer(referrer: string): boolean {
  try {
    const hostname = new URL(referrer).hostname
    return hostname !== 'supabase.com' && !hostname.endsWith('.supabase.com')
  } catch {
    return false
  }
}

export function setFirstTouchReferrerCookie(data: FirstTouchData) {
  if (!isBrowser) return

  // Don't overwrite an existing first-touch cookie
  if (getFirstTouchReferrerCookie()) return

  const cookieOptions = getTelemetryCookieOptions()
  const encodedData = encodeURIComponent(JSON.stringify(data))
  // 30-minute TTL covers typical www → signup flow
  document.cookie = `${FIRST_TOUCH_COOKIE_KEY}=${encodedData}; max-age=1800; ${cookieOptions}`
}

export function getFirstTouchReferrerCookie(): FirstTouchData | null {
  if (!isBrowser) return null

  try {
    const cookies = document.cookie.split(';')
    const cookie = cookies
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${FIRST_TOUCH_COOKIE_KEY}=`))

    if (!cookie) return null

    const value = cookie.slice(`${FIRST_TOUCH_COOKIE_KEY}=`.length)
    return JSON.parse(decodeURIComponent(value)) as FirstTouchData
  } catch {
    return null
  }
}

export function clearFirstTouchReferrerCookie() {
  if (!isBrowser) return
  document.cookie = `${FIRST_TOUCH_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; ${getTelemetryCookieOptions()}`
}

// Parse session_id from PostHog cookie since SDK doesn't expose session ID
// (needed to correlate client and server events)
function getPostHogSessionId(): string | null {
  if (!isBrowser) return null

  try {
    // Parse PostHog cookie to extract session ID
    const phCookies = document.cookie.split(';').find((cookie) => cookie.trim().startsWith('ph_'))

    if (phCookies) {
      const cookieValue = decodeURIComponent(phCookies.split('=')[1])
      const phData = JSON.parse(cookieValue)
      if (phData.$sesid && Array.isArray(phData.$sesid) && phData.$sesid[1]) {
        return phData.$sesid[1]
      }
    }
  } catch (error) {
    console.warn('Could not extract PostHog session ID:', error)
  }

  return null
}

export function getSharedTelemetryData(pathname?: string) {
  const sessionId = getPostHogSessionId()
  const pageUrl = (() => {
    if (!isBrowser) return ''

    try {
      const url = new URL(window.location.href)
      url.hash = ''
      return url.href
    } catch {
      return window.location.href.split('#')[0]
    }
  })()

  return {
    page_url: pageUrl,
    page_title: isBrowser ? document?.title : '',
    pathname: pathname ? pathname : isBrowser ? window.location.pathname : '',
    session_id: sessionId,
    ph: {
      referrer: isBrowser ? document?.referrer : '',
      language: navigator.language ?? 'en-US',
      user_agent: navigator.userAgent,
      search: isBrowser ? window.location.search : '',
      viewport_height: isBrowser ? window.innerHeight : 0,
      viewport_width: isBrowser ? window.innerWidth : 0,
    },
  }
}
