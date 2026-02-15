import { ReactNode } from 'react'

import { useIsNavigationV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { StorageMenuV2 } from 'components/interfaces/Storage/StorageMenuV2'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayoutV2'
import { ProjectLayout } from '../ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title={title || 'Storage'} product="Storage">
        {children}
      </ProjectLayoutV2>
    )
  }

  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)
