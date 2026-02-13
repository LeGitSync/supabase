import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
  pixelBasedPreset,
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './components/EmailFooter'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AffectedProject {
  name: string
  createdBy?: string
  affectedEntities: string[]
  moreEntitiesCount?: number
  resolveUrl: string
}

interface SecurityIssue {
  severity: 'critical' | 'warning'
  title: string
  count?: number
  description: string
  learnMoreUrl?: string
  affectedProjects: AffectedProject[]
  overflowText?: string
  overflowUrl?: string
}

interface SecurityAdvisoryEmailProps {
  totalIssueCount?: number
  projectCount?: number
  issues?: SecurityIssue[]
  docsUrl?: string
  supportUrl?: string
  notificationSettingsUrl?: string
}

// ---------------------------------------------------------------------------
// Default preview data
// ---------------------------------------------------------------------------

const baseUrl = 'https://supabase.com'

const defaultIssues: SecurityIssue[] = [
  {
    severity: 'critical',
    title: 'Table is publicly accessible',
    count: 3,
    description:
      'Anyone with your project URL can read, edit, and delete all data in this table because Row-Level Security is not enabled.',
    affectedProjects: [
      {
        name: 'My Fancy Project',
        createdBy: 'reckless.colleague@example.com',
        affectedEntities: [
          'public.comments',
          'public.foo',
          'public.colors',
          'public.restaurants',
          'public.bar',
        ],
        moreEntitiesCount: 3,
        resolveUrl: `${baseUrl}/dashboard/project/abc123/advisor`,
      },
      {
        name: 'another-project',
        affectedEntities: ['storage.foo_bar_fizz'],
        resolveUrl: `${baseUrl}/dashboard/project/def456/advisor`,
      },
    ],
    overflowText: '+99 other tables across 3 more of your projects',
    overflowUrl: `${baseUrl}/dashboard`,
  },
  {
    severity: 'critical',
    title: 'User data exposed through a view',
    count: 8,
    description:
      "A view is exposing your users' personal information to anyone who can access your API.",
    learnMoreUrl: `${baseUrl}/docs/guides/database/database-linter`,
    affectedProjects: [
      {
        name: 'My Fancy Project',
        createdBy: 'reckless.colleague@example.com',
        affectedEntities: [
          'public.comments',
          'public.foo',
          'public.colors',
          'public.restaurants',
          'public.bar',
        ],
        moreEntitiesCount: 3,
        resolveUrl: `${baseUrl}/dashboard/project/abc123/advisor`,
      },
    ],
  },
  {
    severity: 'critical',
    title: 'Foreign key blocks Auth upgrades',
    description:
      'A foreign key references a constraint in the auth schema that is scheduled for removal, which will prevent future Auth updates and security patches.',
    learnMoreUrl: `${baseUrl}/docs/guides/database/database-linter`,
    affectedProjects: [
      {
        name: 'My Fancy Project',
        affectedEntities: ['public.some_tablee'],
        resolveUrl: `${baseUrl}/dashboard/project/abc123/advisor`,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Tailwind config — colour tokens from the Supabase design system (light theme)
//
// destructive-default: hsl(10.2, 77.9%, 53.9%) → #E54D2E
// destructive-600:     hsl(9.9, 82%, 43.5%)    → #CA3214
// foreground-default:  hsl(0, 0%, 9%)           → #171717
// foreground-light:    hsl(0, 0%, 32.2%)        → #525252
// foreground-lighter:  hsl(0, 0%, 43.9%)        → #707070
// foreground-muted:    hsl(0, 0%, 62.7%)        → #A0A0A0
// border-default:      hsl(0, 0%, 90.2%)        → #E6E6E6
// ---------------------------------------------------------------------------

const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: '#007291',
        destructive: {
          DEFAULT: '#E54D2E',
          600: '#CA3214',
        },
        foreground: {
          DEFAULT: '#171717',
          light: '#525252',
          lighter: '#707070',
          muted: '#A0A0A0',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Ubuntu',
          'sans-serif',
        ],
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SecurityAdvisoryEmail = ({
  totalIssueCount = 32,
  projectCount = 99,
  issues = defaultIssues,
  docsUrl = `${baseUrl}/docs/guides/database/database-linter`,
  supportUrl = `${baseUrl}/support`,
  notificationSettingsUrl = `${baseUrl}/dashboard/account/notifications`,
}: SecurityAdvisoryEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Preview>{`${totalIssueCount} security issues require your immediate attention`}</Preview>
        <Body className="bg-white font-sans py-6 px-3">
          <Container className="bg-white mx-auto max-w-[600px]">
            <Section>
              {/* Warning badge */}
              <Row className="mb-4">
                <Column style={{ width: '32px', verticalAlign: 'middle' }}>
                  <Text
                    className="bg-destructive text-white rounded-lg text-center text-[16px] m-0 inline-block"
                    style={{ width: '28px', height: '28px', lineHeight: '28px' }}
                  >
                    ⚠
                  </Text>
                </Column>
                <Column style={{ verticalAlign: 'middle' }}>
                  <Text className="text-destructive text-[16px] font-semibold m-0 pl-1.5">
                    ×{totalIssueCount}
                  </Text>
                </Column>
              </Row>

              {/* Heading */}
              <Heading className="text-destructive-600 text-[28px] font-bold leading-[1.2] mt-0 mb-4">
                These issues require
                <br />
                your immediate attention
              </Heading>

              {/* Intro */}
              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-0 mb-8">
                We detected security vulnerabilities in {projectCount} of your projects that could
                expose your data to unauthorized access.{' '}
                <strong>Review and fix them before your data is compromised.</strong>
              </Text>

              {/* Issue cards */}
              {issues.map((issue, i) => (
                <Section key={i} className="border border-[#E6E6E6] rounded-lg p-6 mb-4">
                  <Text className="text-foreground-muted text-[11px] font-semibold uppercase tracking-[0.5px] mt-0 mb-2">
                    {issue.severity === 'critical' ? 'CRITICAL ISSUE' : 'WARNING'}
                  </Text>

                  <Heading
                    as="h2"
                    className="text-destructive-600 text-[18px] font-semibold leading-[1.3] mt-0 mb-2"
                  >
                    {issue.title}
                    {issue.count != null && (
                      <span className="font-normal text-[14px]">&nbsp;×{issue.count}</span>
                    )}
                  </Heading>

                  <Text className="text-foreground-light text-[14px] leading-[1.5] m-0">
                    {issue.description}
                    {issue.learnMoreUrl && (
                      <>
                        {' '}
                        <Link
                          href={issue.learnMoreUrl}
                          className="text-foreground-lighter underline"
                        >
                          Learn more
                        </Link>
                      </>
                    )}
                  </Text>

                  <Hr className="border-[#E6E6E6] my-4" />

                  <Text className="text-foreground-muted text-[11px] font-semibold uppercase tracking-[0.5px] mt-0 mb-3">
                    AFFECTS
                  </Text>

                  {issue.affectedProjects.map((project, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <Hr className="border-[#E6E6E6] my-3" />}
                      <Row>
                        <Column style={{ verticalAlign: 'middle' }}>
                          <Text className="text-foreground text-[14px] font-semibold mt-0 mb-0.5">
                            {project.name}
                          </Text>
                          {project.createdBy && (
                            <Text className="text-foreground-lighter text-[13px] mt-0 mb-2">
                              Created by {project.createdBy}
                            </Text>
                          )}
                          <Text className="text-foreground-light text-[12px] font-mono leading-[1.4] m-0">
                            {project.affectedEntities.join(', ')}
                            {project.moreEntitiesCount != null &&
                              project.moreEntitiesCount > 0 &&
                              `, and ${project.moreEntitiesCount} other tables`}
                          </Text>
                        </Column>
                        <Column
                          style={{
                            width: '120px',
                            verticalAlign: 'middle',
                            textAlign: 'right' as const,
                          }}
                        >
                          <Button
                            href={project.resolveUrl}
                            className="bg-destructive-600 text-white rounded-md text-[14px] font-semibold px-4 py-3 no-underline text-center inline-block"
                          >
                            Resolve now
                          </Button>
                        </Column>
                      </Row>
                    </React.Fragment>
                  ))}

                  {issue.overflowText && (
                    <Text className="text-foreground-lighter text-[13px] mt-3 mb-0">
                      {issue.overflowUrl ? (
                        <Link
                          href={issue.overflowUrl}
                          className="text-foreground-lighter underline"
                        >
                          {issue.overflowText}
                        </Link>
                      ) : (
                        issue.overflowText
                      )}
                    </Text>
                  )}
                </Section>
              ))}

              {/* Closing copy */}
              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-0 mb-4">
                If these are not intentional,{' '}
                <strong>they could result in unauthorized access to your database</strong>. We have
                a robust set of security checks which you can read about in{' '}
                <Link href={docsUrl} className="text-foreground-light underline">
                  our docs
                </Link>
                .
              </Text>

              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-0 mb-4">
                Reach out to{' '}
                <Link href={supportUrl} className="text-foreground-light underline">
                  our support team
                </Link>{' '}
                if you have any questions.
              </Text>

              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-6 mb-0">
                Best,
                <br />
                Supabase
              </Text>
            </Section>

            <Hr className="border-[#E6E6E6] m-0" />

            <EmailFooter notificationSettingsUrl={notificationSettingsUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default SecurityAdvisoryEmail
