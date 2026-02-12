import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from '../constants'
import {
  getSharedTelemetryData,
  getTelemetryCookieOptions,
  isExternalReferrer,
  setFirstTouchReferrerCookie,
} from '../telemetry-utils'

interface UseTelemetryCookieProps {
  enabled: boolean
}

/**
 * This hook saves the initial telemetry data to a cookie so we can preserve first-touch attribution
 * (e.g. `document.referrer`) until the initial pageview is emitted. If the user never
 * consents, this cookie is never used.
 */
export function useTelemetryCookie({ enabled }: UseTelemetryCookieProps) {
  const telemetryStorageKey = LOCAL_STORAGE_KEYS.TELEMETRY_DATA

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!enabled) return

    const referrer = document.referrer

    // Persist external referrer in a separate first-touch cookie that survives
    // across www → dashboard navigation (unlike the telemetry data cookie which
    // is cleared after the initial pageview).
    if (referrer && isExternalReferrer(referrer)) {
      try {
        setFirstTouchReferrerCookie({
          referrer,
          referring_domain: new URL(referrer).hostname,
          page_url: window.location.href,
        })
      } catch {
        // URL parsing failed, skip
      }
    }

    const cookies = document.cookie.split(';')
    const cookieOptions = getTelemetryCookieOptions()

    const telemetryCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${telemetryStorageKey}=`)
    )
    if (telemetryCookie) return

    const telemetryData = getSharedTelemetryData(window.location.pathname)

    const encodedData = encodeURIComponent(JSON.stringify(telemetryData))
    document.cookie = `${telemetryStorageKey}=${encodedData}; ${cookieOptions}`
  }, [enabled, telemetryStorageKey])
}

export default useTelemetryCookie
