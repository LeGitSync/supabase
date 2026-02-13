import { describe, expect, it } from 'vitest'

import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_NAME,
  isExternalReferrer,
  parseFirstReferrerCookie,
  serializeFirstReferrerCookie,
} from './first-referrer-cookie'

describe('first-referrer-cookie', () => {
  describe('isExternalReferrer', () => {
    it('returns false for supabase domains', () => {
      expect(isExternalReferrer('https://supabase.com')).toBe(false)
      expect(isExternalReferrer('https://www.supabase.com')).toBe(false)
      expect(isExternalReferrer('https://docs.supabase.com')).toBe(false)
    })

    it('returns true for external domains', () => {
      expect(isExternalReferrer('https://google.com')).toBe(true)
      expect(isExternalReferrer('https://chatgpt.com')).toBe(true)
    })

    it('returns false for invalid values', () => {
      expect(isExternalReferrer('')).toBe(false)
      expect(isExternalReferrer('not-a-url')).toBe(false)
    })
  })

  describe('buildFirstReferrerData', () => {
    it('extracts utm and click-id params from landing url', () => {
      const data = buildFirstReferrerData({
        referrer: 'https://www.google.com/',
        landingUrl:
          'https://supabase.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=abc123&msclkid=xyz456',
      })

      expect(data.referrer).toBe('https://www.google.com/')
      expect(data.landing_url).toBe(
        'https://supabase.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=abc123&msclkid=xyz456'
      )

      expect(data.utms).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test',
      })

      expect(data.click_ids).toEqual({
        gclid: 'abc123',
        msclkid: 'xyz456',
      })
    })
  })

  describe('serialize / parse', () => {
    it('round-trips valid cookie payloads', () => {
      const input = buildFirstReferrerData({
        referrer: 'https://www.google.com/',
        landingUrl: 'https://supabase.com/pricing?utm_source=google',
      })

      const encoded = serializeFirstReferrerCookie(input)
      const parsed = parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)

      expect(parsed).toEqual(input)
    })

    it('returns null for malformed json', () => {
      expect(parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=%7Bnot-json`)).toBeNull()
    })

    it('returns null for invalid payload shape', () => {
      const encoded = encodeURIComponent(JSON.stringify({ foo: 'bar' }))
      expect(parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)).toBeNull()
    })

    it('drops non-string values in utms/click_ids', () => {
      const encoded = encodeURIComponent(
        JSON.stringify({
          referrer: 'https://www.google.com/',
          landing_url: 'https://supabase.com/pricing',
          utms: { utm_source: 'google', utm_medium: 123 },
          click_ids: { gclid: 'abc', msclkid: null },
          ts: 123,
        })
      )

      const parsed = parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)

      expect(parsed).toEqual({
        referrer: 'https://www.google.com/',
        landing_url: 'https://supabase.com/pricing',
        utms: { utm_source: 'google' },
        click_ids: { gclid: 'abc' },
        ts: 123,
      })
    })
  })
})
