/**
 * Shared utilities for the cross-app first-referrer handoff cookie.
 *
 * The `_sb_first_referrer` cookie is written by edge middleware on `apps/www`
 * and `apps/docs` when a user arrives from an external source. Studio reads
 * it on the first telemetry pageview to recover external attribution context
 * that would otherwise be lost at the app boundary.
 *
 * Write-once, 365-day TTL, domain=supabase.com (readable across all subdomains).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FIRST_REFERRER_COOKIE_NAME = '_sb_first_referrer'

/** 365 days in seconds */
export const FIRST_REFERRER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FirstReferrerData {
  /** The external referrer URL (e.g. https://www.google.com/) */
  referrer: string
  /** The landing URL on our site when the external referrer was captured */
  landing_url: string
  /** UTM params parsed from the landing URL (keys without the utm_ prefix) */
  utms: Record<string, string>
  /** Ad-network click IDs parsed from the landing URL */
  click_ids: Record<string, string>
  /** Unix timestamp (ms) when the cookie was written */
  ts: number
}

// ---------------------------------------------------------------------------
// Referrer classification
// ---------------------------------------------------------------------------

/**
 * Returns true if the referrer URL points to an external (non-Supabase) domain.
 * Handles malformed URLs gracefully by returning false.
 */
export function isExternalReferrer(referrer: string): boolean {
  if (!referrer) return false
  try {
    const hostname = new URL(referrer).hostname
    return hostname !== 'supabase.com' && !hostname.endsWith('.supabase.com')
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// UTM + click-ID extraction
// ---------------------------------------------------------------------------

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

const CLICK_ID_KEYS = [
  'gclid', // Google Ads
  'gbraid', // Google Ads (iOS)
  'wbraid', // Google Ads (iOS)
  'msclkid', // Microsoft Ads (Bing)
  'fbclid', // Meta (Facebook/Instagram)
  'rdt_cid', // Reddit Ads
  'ttclid', // TikTok Ads
  'twclid', // X Ads (Twitter)
  'li_fat_id', // LinkedIn Ads
] as const

function pickParams(searchParams: URLSearchParams, keys: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value) {
      result[key] = value
    }
  }
  return result
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([key, v]) => typeof key === 'string' && typeof v === 'string'
    )
  ) as Record<string, string>
}

// ---------------------------------------------------------------------------
// Build cookie payload from a request (edge-compatible)
// ---------------------------------------------------------------------------

/**
 * Build a `FirstReferrerData` payload from raw request values.
 * Intended for use in Next.js middleware where `document` is not available.
 */
export function buildFirstReferrerData({
  referrer,
  landingUrl,
}: {
  referrer: string
  landingUrl: string
}): FirstReferrerData {
  let utms: Record<string, string> = {}
  let click_ids: Record<string, string> = {}

  try {
    const url = new URL(landingUrl)
    utms = pickParams(url.searchParams, UTM_KEYS)
    click_ids = pickParams(url.searchParams, CLICK_ID_KEYS)
  } catch {
    // If landing URL is malformed, just skip param extraction
  }

  return {
    referrer,
    landing_url: landingUrl,
    utms,
    click_ids,
    ts: Date.now(),
  }
}

// ---------------------------------------------------------------------------
// Serialize / parse
// ---------------------------------------------------------------------------

export function serializeFirstReferrerCookie(data: FirstReferrerData): string {
  return encodeURIComponent(JSON.stringify(data))
}

export function parseFirstReferrerCookie(cookieHeader: string): FirstReferrerData | null {
  try {
    const cookies = cookieHeader.split(';')
    const match = cookies
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${FIRST_REFERRER_COOKIE_NAME}=`))

    if (!match) return null

    const value = match.slice(`${FIRST_REFERRER_COOKIE_NAME}=`.length)
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown

    if (!parsed || typeof parsed !== 'object') return null

    const parsedRecord = parsed as Record<string, unknown>
    const referrer = parsedRecord.referrer
    const landingUrl = parsedRecord.landing_url

    if (typeof referrer !== 'string' || typeof landingUrl !== 'string') {
      return null
    }

    const utmsRaw = parsedRecord.utms
    const clickIdsRaw = parsedRecord.click_ids
    const tsRaw = parsedRecord.ts

    const utms = toStringRecord(utmsRaw)
    const click_ids = toStringRecord(clickIdsRaw)

    const ts = typeof tsRaw === 'number' && Number.isFinite(tsRaw) ? tsRaw : Date.now()

    return {
      referrer,
      landing_url: landingUrl,
      utms,
      click_ids,
      ts,
    }
  } catch {
    return null
  }
}
