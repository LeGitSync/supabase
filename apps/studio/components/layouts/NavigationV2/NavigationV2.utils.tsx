import type { NavGroupItem } from './NavGroup'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import {
  ArrowRightLeft,
  Blocks,
  Compass,
  Copy,
  DatabaseBackup,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  Lightbulb,
  List,
  Lock,
  Network,
  Radio,
  ScrollText,
  Settings,
  Telescope,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface DatabaseNavFlags {
  pgNetExtensionExists?: boolean
  pitrEnabled?: boolean
  columnLevelPrivileges?: boolean
  showPgReplicate?: boolean
  enablePgReplicate?: boolean
  showRoles?: boolean
  showWrappers?: boolean
}

interface PlatformNavFlags {
  authEnabled?: boolean
  edgeFunctionsEnabled?: boolean
  storageEnabled?: boolean
  realtimeEnabled?: boolean
  authOverviewPageEnabled?: boolean
}

interface OtherNavFlags {
  showReports?: boolean
  unifiedLogs?: boolean
  apiDocsSidePanel?: boolean
}

export function generateDatabaseNavItems(
  ref: string,
  project?: Project,
  flags?: DatabaseNavFlags
): NavGroupItem[] {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}`

  const {
    pgNetExtensionExists,
    pitrEnabled,
    columnLevelPrivileges,
    showPgReplicate,
    enablePgReplicate,
    showRoles,
    showWrappers,
  } = flags || {}

  return [
    {
      title: 'Table Editor',
      url: isProjectBuilding ? buildingUrl : `/project/${ref}/editor`,
      icon: FileText,
    },
    {
      title: 'SQL Editor',
      url: isProjectBuilding ? buildingUrl : `/project/${ref}/sql`,
      icon: Zap,
    },
    {
      title: 'Schema Visualizer',
      url: isProjectBuilding
        ? buildingUrl
        : isProjectActive
          ? `/project/${ref}/database/schemas`
          : `/project/${ref}/database/backups/scheduled`,
      icon: Network,
      items: [
        { title: 'Tables', url: `/project/${ref}/database/tables` },
        { title: 'Functions', url: `/project/${ref}/database/functions` },
        { title: 'Triggers', url: `/project/${ref}/database/triggers/data` },
        { title: 'Enumerated Types', url: `/project/${ref}/database/types` },
        { title: 'Extensions', url: `/project/${ref}/database/extensions` },
        { title: 'Indexes', url: `/project/${ref}/database/indexes` },
        { title: 'Publications', url: `/project/${ref}/database/publications` },
        ...(showRoles
          ? [{ title: 'Roles', url: `/project/${ref}/database/roles` }]
          : []),
        ...(columnLevelPrivileges
          ? [{ title: 'Column Privileges', url: `/project/${ref}/database/column-privileges` }]
          : []),
      ],
    },
    ...(IS_PLATFORM && showPgReplicate
      ? [
          {
            title: 'Replication',
            url: `/project/${ref}/database/replication`,
            icon: Copy,
            label: enablePgReplicate ? 'New' : undefined,
          },
        ]
      : []),
    ...(IS_PLATFORM
      ? [
          {
            title: 'Backups',
            url: pitrEnabled
              ? `/project/${ref}/database/backups/pitr`
              : `/project/${ref}/database/backups/scheduled`,
            icon: DatabaseBackup,
          },
        ]
      : []),
    {
      title: 'Migrations',
      url: `/project/${ref}/database/migrations`,
      icon: ArrowRightLeft,
    },
    {
      title: 'Database Settings',
      url: `/project/${ref}/database/settings`,
      icon: Settings,
    },
  ]
}

export function generatePlatformNavItems(
  ref: string,
  project?: Project,
  flags?: PlatformNavFlags
): NavGroupItem[] {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const {
    authEnabled = true,
    edgeFunctionsEnabled = true,
    storageEnabled = true,
    realtimeEnabled = true,
    authOverviewPageEnabled = false,
  } = flags || {}

  return [
    ...(authEnabled
      ? [
          {
            title: 'Authentication',
            url: isProjectBuilding
              ? buildingUrl
              : authOverviewPageEnabled
                ? `/project/${ref}/auth/overview`
                : `/project/${ref}/auth/users`,
            icon: Lock,
            items: [
              { title: 'Users', url: `/project/${ref}/auth/users` },
              { title: 'Policies', url: `/project/${ref}/auth/policies` },
              ...(IS_PLATFORM
                ? [
                    { title: 'Providers', url: `/project/${ref}/auth/providers` },
                    { title: 'Sessions', url: `/project/${ref}/auth/sessions` },
                    { title: 'Rate Limits', url: `/project/${ref}/auth/rate-limits` },
                    { title: 'Email Templates', url: `/project/${ref}/auth/templates` },
                    { title: 'URL Configuration', url: `/project/${ref}/auth/url-configuration` },
                    { title: 'Auth Hooks', url: `/project/${ref}/auth/hooks` },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            title: 'Storage',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/storage/files`,
            icon: HardDrive,
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            title: 'Edge Functions',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/functions`,
            icon: Globe,
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            title: 'Realtime',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`,
            icon: Radio,
          },
        ]
      : []),
  ]
}

export function generateObservabilityNavItems(
  ref: string,
  project?: Project,
  flags?: OtherNavFlags
): NavGroupItem[] {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const { showReports = true, unifiedLogs = false } = flags || {}

  return [
    {
      title: 'Advisors',
      url: isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`,
      icon: Lightbulb,
    },
    ...(IS_PLATFORM && showReports
      ? [
          {
            title: 'Observability',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/observability`,
            icon: Telescope,
          },
        ]
      : []),
    {
      title: 'Logs',
      url: isProjectBuilding
        ? buildingUrl
        : unifiedLogs
          ? `/project/${ref}/logs`
          : `/project/${ref}/logs/explorer`,
      icon: ScrollText,
    },
  ]
}

export function generateIntegrationsNavItems(
  ref: string,
  project?: Project,
  flags?: OtherNavFlags
): NavGroupItem[] {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const { apiDocsSidePanel = false } = flags || {}

  return [
    ...(apiDocsSidePanel
      ? [
          {
            title: 'API Docs',
            url: isProjectBuilding
              ? buildingUrl
              : `/project/${ref}/integrations/data_api/docs`,
            icon: FileText,
          },
        ]
      : []),
    {
      title: 'Integrations',
      url: isProjectBuilding ? buildingUrl : `/project/${ref}/integrations`,
      icon: Blocks,
    },
  ]
}
