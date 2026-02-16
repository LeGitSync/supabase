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
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './components/EmailFooter'
import { emailTailwindConfig } from './theme'

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
  /** Lint rule id (e.g. '0002_auth_users_exposed'); used to build learn-more URL */
  lintRule?: string
  count?: number
  description: string
  affectedProjects: AffectedProject[]
  /** When set, shows "+X other tables across Y of your project(s)" with link to overflowUrl on the projects part */
  overflowTablesCount?: number
  overflowProjectsCount?: number
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
    title: 'Table publicly accessible',
    lintRule: '0013_rls_disabled_in_public',
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
    overflowTablesCount: 99,
    overflowProjectsCount: 3,
    overflowUrl: `${baseUrl}/dashboard`,
  },
  {
    severity: 'critical',
    title: 'User data exposed through a view',
    lintRule: '0002_auth_users_exposed',
    count: 8,
    description:
      "A view is exposing your users' personal information to anyone who can access your API.",
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
    lintRule: '0021_fkey_to_auth_unique',
    description:
      'A foreign key references a constraint in the auth schema that is scheduled for removal, which will prevent future Auth updates and security patches.',
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
  docsUrl = `${baseUrl}/docs/guides/database/database-advisors`,
  supportUrl = `${baseUrl}/support`,
  notificationSettingsUrl = `${baseUrl}/dashboard/account/notifications`,
}: SecurityAdvisoryEmailProps) => {
  return (
    <Html>
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Preview>{`${totalIssueCount} security issues require your immediate attention`}</Preview>
        <Body className="bg-white font-sans px-1.5 py-6 md:py-8">
          <Container className="bg-white mx-auto max-w-[600px]">
            <Section>
              {/* Warning badge */}
              <Row className="mb-3">
                <Column style={{ width: '24px', verticalAlign: 'left' }}>
                  <Text
                    className="bg-destructive text-white rounded-md text-center text-[14px] m-0 mr-1 inline-block"
                    style={{ width: '24px', height: '24px', lineHeight: '24px' }}
                  >
                    ⚠
                  </Text>
                </Column>
                <Column>
                  <Text className="bg-destructive-300 px-1.5 h-[24px] text-destructive-600 rounded-md text-center m-0 inline-block">
                    <span className="text-destructive text-[13px] font-semibold m-0">
                      ×{totalIssueCount}
                    </span>
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
                <strong className="text-foreground font-semibold">
                  Review and fix them before your data is compromised.
                </strong>
              </Text>

              {/* Issue cards */}
              {issues.map((issue, i) => {
                const learnMoreUrl = issue.lintRule
                  ? `${docsUrl}?lint=${issue.lintRule}#available-checks`
                  : undefined
                return (
                  <Section key={i} className="border border-default rounded-md p-4 mb-4">
                    <Text className="text-foreground-muted text-[11px] uppercase tracking-[0.85px] mt-0 mb-2">
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
                      {learnMoreUrl && (
                        <>
                          {' '}
                          <Link
                            href={learnMoreUrl}
                            className="text-foreground-lighter underline hover:text-foreground transition-colors"
                          >
                            Learn more
                          </Link>
                        </>
                      )}
                    </Text>

                    <Hr className="border-[#E8E8E8] opacity-80 my-5" />

                    <Text className="text-foreground-muted text-[11px] uppercase tracking-[0.85px] mt-0 mb-2">
                      AFFECTS
                    </Text>

                    {issue.affectedProjects.map((project, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <Hr className="border-[#E8E8E8] opacity-50 my-5" />}
                        <Row>
                          <Column style={{ verticalAlign: 'top' }} className="w-full">
                            <Text className="text-foreground text-[14px] font-semibold mt-0 mb-0.5">
                              {project.name}
                            </Text>
                            {project.createdBy && (
                              <Text className="text-foreground-muted text-[13px] leading-[1.3] mt-0 mb-2 break-all">
                                Created by {project.createdBy}
                              </Text>
                            )}
                            <Text className="text-foreground-light text-[12px] font-mono leading-[1.5] m-0">
                              {project.affectedEntities.join(', ')}
                            </Text>
                            {project.moreEntitiesCount != null && project.moreEntitiesCount > 0 && (
                              <Text className="text-foreground-muted text-[13px] leading-[1.4] mt-1 mb-0  ">
                                +{project.moreEntitiesCount} other tables
                              </Text>
                            )}
                          </Column>
                        </Row>
                        <Row>
                          <Column className="pt-3.5">
                            <Button
                              href={project.resolveUrl}
                              className="w-full sm:w-auto bg-destructive-600 hover:bg-destructive-700 transition-colors text-white rounded-md text-[14px] font-semibold px-3 py-2.5 no-underline text-center inline-block box-border"
                            >
                              Resolve now
                            </Button>
                          </Column>
                        </Row>
                      </React.Fragment>
                    ))}

                    {issue.overflowTablesCount != null && issue.overflowProjectsCount != null && (
                      <>
                        <Hr className="border-[#E8E8E8] opacity-50 my-5" />
                        <Text className="text-foreground-muted text-[13px] leading-[1.4] mt-3 mb-0">
                          +{issue.overflowTablesCount} other tables across{' '}
                          {issue.overflowUrl ? (
                            <>
                              <Link
                                href={issue.overflowUrl}
                                className="text-foreground-muted underline hover:text-foreground-lighter transition-colors"
                              >
                                {issue.overflowProjectsCount} more project
                                {issue.overflowProjectsCount === 1 ? '' : 's'}
                              </Link>
                            </>
                          ) : (
                            <>
                              {issue.overflowProjectsCount} more project
                              {issue.overflowProjectsCount === 1 ? '' : 's'}
                            </>
                          )}
                        </Text>
                      </>
                    )}
                  </Section>
                )
              })}

              {/* Closing copy */}
              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-8 mb-4">
                If these are not intentional,{' '}
                <strong className="text-foreground font-semibold">
                  they could result in unauthorized access to your database
                </strong>
                . We have a robust set of security checks which you can read about in{' '}
                <Link
                  href={docsUrl}
                  className="text-foreground-light underline hover:text-foreground transition-colors"
                >
                  our docs
                </Link>
                .
              </Text>

              <Text className="text-foreground-light text-[15px] leading-[1.6] mt-0 mb-4">
                Reach out to{' '}
                <Link
                  href={supportUrl}
                  className="text-foreground-light underline hover:text-foreground transition-colors"
                >
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

            <Hr className="border-[#E8E8E8] my-8" />

            <EmailFooter notificationSettingsUrl={notificationSettingsUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default SecurityAdvisoryEmail
