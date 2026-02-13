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
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './components/EmailFooter'

/**
 * Color tokens derived from the Supabase design system.
 *
 * destructive-600 (light):  hsl(9.9, 82%, 43.5%)  → #CA3214
 * destructive-default:      hsl(10.2, 77.9%, 53.9%) → #E54D2E
 */
const colors = {
  destructive: '#E54D2E',
  destructive600: '#CA3214',
  foreground: '#171717',
  foregroundLight: '#525252',
  foregroundLighter: '#707070',
  foregroundMuted: '#A0A0A0',
  border: '#E6E6E6',
  white: '#FFFFFF',
}

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
      <Preview>
        {`${totalIssueCount} security issues require your immediate attention`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ---- Main content ---- */}
          <Section style={content}>
            {/* Warning badge */}
            <Row style={{ marginBottom: '16px' }}>
              <Column style={{ width: '32px', verticalAlign: 'middle' }}>
                <Text style={warningIcon}>⚠</Text>
              </Column>
              <Column style={{ verticalAlign: 'middle' }}>
                <Text style={badgeCount}>×{totalIssueCount}</Text>
              </Column>
            </Row>

            {/* Heading */}
            <Heading style={heading}>
              These issues require
              <br />
              your immediate attention
            </Heading>

            {/* Intro */}
            <Text style={introText}>
              We detected security vulnerabilities in {projectCount} of your
              projects that could expose your data to unauthorized access.{' '}
              <strong>
                Review and fix them before your data is compromised.
              </strong>
            </Text>

            {/* Issue cards */}
            {issues.map((issue, i) => (
              <Section key={i} style={issueCard}>
                {/* Severity label */}
                <Text style={severityLabel}>
                  {issue.severity === 'critical'
                    ? 'CRITICAL ISSUE'
                    : 'WARNING'}
                </Text>

                {/* Issue title */}
                <Heading as="h2" style={issueTitle}>
                  {issue.title}
                  {issue.count != null && (
                    <span style={issueCountStyle}>&nbsp;×{issue.count}</span>
                  )}
                </Heading>

                {/* Description */}
                <Text style={issueDescription}>
                  {issue.description}
                  {issue.learnMoreUrl && (
                    <>
                      {' '}
                      <Link href={issue.learnMoreUrl} style={learnMoreLink}>
                        Learn more
                      </Link>
                    </>
                  )}
                </Text>

                <Hr style={issueDivider} />

                {/* Affects */}
                <Text style={affectsLabel}>AFFECTS</Text>

                {issue.affectedProjects.map((project, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <Hr style={projectDivider} />}
                    <Row>
                      <Column style={projectInfoCol}>
                        <Text style={projectName}>{project.name}</Text>
                        {project.createdBy && (
                          <Text style={projectCreatedBy}>
                            Created by {project.createdBy}
                          </Text>
                        )}
                        <Text style={entitiesList}>
                          {project.affectedEntities.join(', ')}
                          {project.moreEntitiesCount != null &&
                            project.moreEntitiesCount > 0 &&
                            `, and ${project.moreEntitiesCount} other tables`}
                        </Text>
                      </Column>
                      <Column style={resolveCol}>
                        <Button href={project.resolveUrl} style={resolveButton}>
                          Resolve now
                        </Button>
                      </Column>
                    </Row>
                  </React.Fragment>
                ))}

                {/* Overflow */}
                {issue.overflowText && (
                  <Text style={overflowText}>
                    {issue.overflowUrl ? (
                      <Link href={issue.overflowUrl} style={overflowLink}>
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
            <Text style={closingText}>
              If these are not intentional,{' '}
              <strong>
                they could result in unauthorized access to your database
              </strong>
              . We have a robust set of security checks which you can read about
              in{' '}
              <Link href={docsUrl} style={inlineLink}>
                our docs
              </Link>
              .
            </Text>

            <Text style={closingText}>
              Reach out to{' '}
              <Link href={supportUrl} style={inlineLink}>
                our support team
              </Link>{' '}
              if you have any questions.
            </Text>

            <Text style={signoff}>
              Best,
              <br />
              Supabase
            </Text>
          </Section>

          <Hr style={footerDivider} />

          {/* ---- Footer ---- */}
          <EmailFooter notificationSettingsUrl={notificationSettingsUrl} />
        </Container>
      </Body>
    </Html>
  )
}

export default SecurityAdvisoryEmail

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif'

const main: React.CSSProperties = {
  // backgroundColor: '#F5F5F5',
  backgroundColor: "white",
  fontFamily,
  padding: '24px 12px', // Defaults to 8px
}

const container: React.CSSProperties = {
  backgroundColor: colors.white,
  margin: '0 auto',
  maxWidth: '600px',
}

const content: React.CSSProperties = {
  // padding: '40px 48px',
  // margin: '24px auto',
}

// -- Header --

const warningIcon: React.CSSProperties = {
  backgroundColor: colors.destructive,
  color: colors.white,
  borderRadius: '8px',
  width: '28px',
  height: '28px',
  lineHeight: '28px',
  textAlign: 'center',
  fontSize: '16px',
  margin: '0',
  display: 'inline-block',
}

const badgeCount: React.CSSProperties = {
  color: colors.destructive,
  // backgroundColor: colors.destructive + '10',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  paddingLeft: '6px',
}

const heading: React.CSSProperties = {
  color: colors.destructive600,
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 16px',
}

const introText: React.CSSProperties = {
  color: colors.foregroundLight,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 32px',
}

// -- Issue card --

const issueCard: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '16px',
}

const severityLabel: React.CSSProperties = {
  color: colors.foregroundMuted,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  margin: '0 0 8px',
}

const issueTitle: React.CSSProperties = {
  color: colors.destructive600,
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 8px',
}

const issueCountStyle: React.CSSProperties = {
  fontWeight: '400',
  fontSize: '14px',
}

const issueDescription: React.CSSProperties = {
  color: colors.foregroundLight,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const learnMoreLink: React.CSSProperties = {
  color: colors.foregroundLighter,
  textDecoration: 'underline',
}

const issueDivider: React.CSSProperties = {
  borderColor: colors.border,
  margin: '16px 0',
}

const affectsLabel: React.CSSProperties = {
  color: colors.foregroundMuted,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  margin: '0 0 12px',
}

// -- Project rows --

const projectDivider: React.CSSProperties = {
  borderColor: colors.border,
  margin: '12px 0',
}

const projectInfoCol: React.CSSProperties = {
  verticalAlign: 'middle',
}

const projectName: React.CSSProperties = {
  color: colors.foreground,
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 2px',
}

const projectCreatedBy: React.CSSProperties = {
  color: colors.foregroundLighter,
  fontSize: '13px',
  margin: '0 0 8px',
}

const entitiesList: React.CSSProperties = {
  color: colors.foregroundLight,
  fontSize: '12px',
  fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace',
  lineHeight: '1.4',
  margin: '0',
}

const resolveCol: React.CSSProperties = {
  width: '120px',
  verticalAlign: 'middle',
  textAlign: 'right',
}

const resolveButton: React.CSSProperties = {
  backgroundColor: colors.destructive600,
  color: colors.white,
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 16px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
}

// -- Overflow --

const overflowText: React.CSSProperties = {
  color: colors.foregroundLighter,
  fontSize: '13px',
  margin: '12px 0 0',
}

const overflowLink: React.CSSProperties = {
  color: colors.foregroundLighter,
  textDecoration: 'underline',
}

// -- Closing --

const closingText: React.CSSProperties = {
  color: colors.foregroundLight,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const inlineLink: React.CSSProperties = {
  color: colors.foregroundLight,
  textDecoration: 'underline',
}

const signoff: React.CSSProperties = {
  color: colors.foregroundLight,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '24px 0 0',
}

const footerDivider: React.CSSProperties = {
  borderColor: colors.border,
  margin: '0',
}
