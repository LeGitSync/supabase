import { Img, Link, Section, Text } from '@react-email/components'
import * as React from 'react'

/**
 * Shared email footer. Use inside a template wrapped with
 * <Tailwind config={emailTailwindConfig}> from ./theme so token classes apply.
 */
interface EmailFooterProps {
  notificationSettingsUrl?: string
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
const supabaseUrl = 'https://supabase.com'

export const EmailFooter = ({
  notificationSettingsUrl = `${supabaseUrl}/dashboard/account/notifications`,
}: EmailFooterProps) => {
  return (
    <Section>
      <Link href={supabaseUrl}>
        <Img
          src={`${baseUrl}/static/supabase-logo-grayscale.png`}
          width="24"
          height="24"
          alt="Supabase"
          className="mb-4"
        />
      </Link>
      <Link
        href={notificationSettingsUrl}
        className="text-foreground-muted text-[13px] underline block mb-4"
      >
        Notification settings
      </Link>
      <Text className="text-foreground-muted text-[12px] leading-[1.5] m-0">
        Supabase Inc,
        <br />
        3500 S. DuPont Highway,
        <br />
        Kent 19901, Dover, Delaware, USA
      </Text>
    </Section>
  )
}
