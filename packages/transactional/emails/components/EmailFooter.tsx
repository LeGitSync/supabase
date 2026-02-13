import { Hr, Img, Link, Section, Text } from '@react-email/components'
import * as React from 'react'

interface EmailFooterProps {
    notificationSettingsUrl?: string
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";


export const EmailFooter = ({
    notificationSettingsUrl = 'https://supabase.com/dashboard/account/notifications',
}: EmailFooterProps) => {
    return (
        <Section style={footer}>
            <Img
                src={`${baseUrl}/static/supabase-logo-grayscale.png`}
                width="20"
                height="20"
                alt="Supabase"
                style={logo}
            />
            <Link href={notificationSettingsUrl} style={settingsLink}>
                Notification settings
            </Link>
            <Text style={address}>
                Supabase Inc,
                <br />
                3500 S. DuPont Highway,
                <br />
                Kent 19901, Dover, Delaware, USA
            </Text>
        </Section>
    )
}

const footer: React.CSSProperties = {
    // padding: '32px 48px',
    marginTop: '28px',
    // textAlign: 'center',
}

const logo: React.CSSProperties = {
    margin: '0 0 16px',
}

const settingsLink: React.CSSProperties = {
    color: '#666666',
    fontSize: '13px',
    textDecoration: 'underline',
    display: 'block',
    marginBottom: '10px',
}

const address: React.CSSProperties = {
    color: '#999999',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0',
}
