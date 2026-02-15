import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useIsNavigationV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayoutV2'
import { ProjectLayout } from '../ProjectLayout'

const EdgeFunctionsProductMenu = () => {
  const { ref: projectRef = 'default' } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const menuItems = [
    {
      title: 'Manage',
      items: [
        {
          name: 'Functions',
          key: 'main',
          pages: ['', '[functionSlug]', 'new'],
          url: `/project/${projectRef}/functions`,
          items: [],
        },
        {
          name: 'Secrets',
          key: 'secrets',
          url: `/project/${projectRef}/functions/secrets`,
          items: [],
        },
      ],
    },
  ]

  return <ProductMenu page={page} menu={menuItems} />
}

const EdgeFunctionsLayout = ({ children }: PropsWithChildren<{}>) => {
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title="Edge Functions" product="Edge Functions" isBlocking={false}>
        {children}
      </ProjectLayoutV2>
    )
  }

  return (
    <ProjectLayout
      title="Edge Functions"
      product="Edge Functions"
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
