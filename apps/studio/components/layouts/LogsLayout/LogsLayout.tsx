import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PropsWithChildren } from 'react'

import { useIsNavigationV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayoutV2'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const isNavigationV2 = useIsNavigationV2Enabled()
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return isNavigationV2 ? (
        <ProjectLayoutV2 isLoading />
      ) : (
        <ProjectLayout isLoading></ProjectLayout>
      )
    }

    if (!isLoading && !canUseLogsExplorer) {
      return isNavigationV2 ? (
        <ProjectLayoutV2>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayoutV2>
      ) : (
        <ProjectLayout>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title={title} product="Logs & Analytics">
        {children}
      </ProjectLayoutV2>
    )
  }

  return (
    <ProjectLayout title={title} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
