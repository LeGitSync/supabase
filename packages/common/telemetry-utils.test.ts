import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearFirstTouchReferrerCookie,
  FirstTouchData,
  getFirstTouchReferrerCookie,
  isExternalReferrer,
  setFirstTouchReferrerCookie,
} from './telemetry-utils'

// Mock the constants module to control IS_PROD
vi.mock('./constants', () => ({
  IS_PROD: false,
  LOCAL_STORAGE_KEYS: {
    TELEMETRY_DATA: 'supabase-telemetry-data',
  },
}))

vi.mock('./helpers', () => ({
  isBrowser: true,
}))

describe('isExternalReferrer', () => {
  it('returns true for external domains', () => {
    expect(isExternalReferrer('https://www.google.com/')).toBe(true)
    expect(isExternalReferrer('https://www.linkedin.com/feed')).toBe(true)
    expect(isExternalReferrer('https://t.co/abc123')).toBe(true)
    expect(isExternalReferrer('https://ads.google.com/campaign')).toBe(true)
  })

  it('returns false for supabase.com', () => {
    expect(isExternalReferrer('https://supabase.com/')).toBe(false)
    expect(isExternalReferrer('https://supabase.com/pricing')).toBe(false)
    expect(isExternalReferrer('https://supabase.com/dashboard')).toBe(false)
  })

  it('returns false for supabase.com subdomains', () => {
    expect(isExternalReferrer('https://app.supabase.com/')).toBe(false)
    expect(isExternalReferrer('https://docs.supabase.com/guides')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isExternalReferrer('')).toBe(false)
    expect(isExternalReferrer('not-a-url')).toBe(false)
  })
})

describe('first-touch referrer cookie', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`
    })
  })

  afterEach(() => {
    // Clean up
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`
    })
  })

  const externalReferrerData: FirstTouchData = {
    referrer: 'https://www.google.com/',
    referring_domain: 'www.google.com',
    page_url: 'https://supabase.com/?utm_source=google&gclid=abc123',
  }

  it('sets and reads a first-touch cookie', () => {
    setFirstTouchReferrerCookie(externalReferrerData)

    const result = getFirstTouchReferrerCookie()
    expect(result).toEqual(externalReferrerData)
  })

  it('does not overwrite an existing first-touch cookie', () => {
    setFirstTouchReferrerCookie(externalReferrerData)

    const linkedInData: FirstTouchData = {
      referrer: 'https://www.linkedin.com/',
      referring_domain: 'www.linkedin.com',
      page_url: 'https://supabase.com/?utm_source=linkedin',
    }
    setFirstTouchReferrerCookie(linkedInData)

    const result = getFirstTouchReferrerCookie()
    // Should still be Google, not LinkedIn
    expect(result).toEqual(externalReferrerData)
  })

  it('returns null when no cookie exists', () => {
    expect(getFirstTouchReferrerCookie()).toBeNull()
  })

  it('clears the first-touch cookie', () => {
    setFirstTouchReferrerCookie(externalReferrerData)
    expect(getFirstTouchReferrerCookie()).not.toBeNull()

    clearFirstTouchReferrerCookie()
    expect(getFirstTouchReferrerCookie()).toBeNull()
  })
})

describe('first-touch referrer attribution scenarios', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`
    })
  })

  afterEach(() => {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`
    })
  })

  it('Scenario A: preserves external referrer when user navigates www → dashboard without consent', () => {
    // Step 1: User lands on supabase.com from Google
    // useTelemetryCookie would call setFirstTouchReferrerCookie
    const googleReferrer: FirstTouchData = {
      referrer: 'https://www.google.com/',
      referring_domain: 'www.google.com',
      page_url: 'https://supabase.com/?gclid=abc123',
    }
    setFirstTouchReferrerCookie(googleReferrer)

    // Step 2: User navigates to dashboard (document.referrer is now supabase.com)
    // The first-touch cookie should still have Google
    const firstTouch = getFirstTouchReferrerCookie()
    expect(firstTouch).not.toBeNull()
    expect(firstTouch!.referrer).toBe('https://www.google.com/')
    expect(firstTouch!.referring_domain).toBe('www.google.com')

    // Verify: the referrer from the cookie is external (can be used to fix attribution)
    expect(isExternalReferrer(firstTouch!.referrer)).toBe(true)

    // Verify: supabase.com referrer (document.referrer on dashboard) is internal
    expect(isExternalReferrer('https://supabase.com/pricing')).toBe(false)
  })

  it('Scenario B: first-touch cookie survives after telemetry data cookie is consumed', () => {
    // Step 1: User lands on supabase.com from Google, consent already accepted
    const googleReferrer: FirstTouchData = {
      referrer: 'https://www.google.com/',
      referring_domain: 'www.google.com',
      page_url: 'https://supabase.com/?utm_source=google&utm_medium=cpc',
    }
    setFirstTouchReferrerCookie(googleReferrer)

    // Step 2: Telemetry data cookie is consumed and cleared on www (simulated)
    // But first-touch cookie persists independently!

    // Step 3: User navigates to dashboard
    const firstTouch = getFirstTouchReferrerCookie()
    expect(firstTouch).not.toBeNull()
    expect(firstTouch!.referrer).toBe('https://www.google.com/')
    // The page_url preserves the original landing URL with UTM params
    expect(firstTouch!.page_url).toContain('utm_source=google')
    expect(firstTouch!.page_url).toContain('utm_medium=cpc')
  })

  it('first-touch cookie is cleared after user identification', () => {
    const googleReferrer: FirstTouchData = {
      referrer: 'https://www.google.com/',
      referring_domain: 'www.google.com',
      page_url: 'https://supabase.com/?gclid=abc123',
    }
    setFirstTouchReferrerCookie(googleReferrer)

    // Simulate: user signs up, identify is called, cookie is cleared
    clearFirstTouchReferrerCookie()

    expect(getFirstTouchReferrerCookie()).toBeNull()
  })

  it('PostHog $initial_referrer override logic: only override internal referrers', () => {
    // Simulate: posthog-js set $initial_referrer to internal supabase.com
    const posthogAutoDetected = 'https://supabase.com/pricing'
    const firstTouch: FirstTouchData = {
      referrer: 'https://www.google.com/',
      referring_domain: 'www.google.com',
      page_url: 'https://supabase.com/?gclid=abc123',
    }

    // posthog-js detected an internal referrer → should be overridden
    const isCurrentWrong =
      !posthogAutoDetected ||
      posthogAutoDetected === '$direct' ||
      !isExternalReferrer(posthogAutoDetected)

    expect(isCurrentWrong).toBe(true) // Internal referrer should be overridden

    // The first-touch cookie has the correct external referrer
    expect(isExternalReferrer(firstTouch.referrer)).toBe(true)
  })

  it('PostHog $initial_referrer override logic: do NOT override correct external referrers', () => {
    // Simulate: posthog-js already has a correct external $initial_referrer
    const posthogAutoDetected = 'https://www.google.com/'

    const isCurrentWrong =
      !posthogAutoDetected ||
      posthogAutoDetected === '$direct' ||
      !isExternalReferrer(posthogAutoDetected)

    expect(isCurrentWrong).toBe(false) // Correct external referrer should NOT be overridden
  })

  it('PostHog $initial_referrer override logic: override $direct when cookie has external referrer', () => {
    const posthogAutoDetected = '$direct'

    const isCurrentWrong =
      !posthogAutoDetected ||
      posthogAutoDetected === '$direct' ||
      !isExternalReferrer(posthogAutoDetected)

    expect(isCurrentWrong).toBe(true) // $direct should be overridden when we have external data
  })
})
