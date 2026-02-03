import  { AuthProvidersForm } from 'components/interfaces/Auth/AuthProvidersForm'
import { BasicAuthSettingsForm } from 'components/interfaces/Auth/BasicAuthSettingsForm'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import dynamic from 'next/dynamic'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'

const CustomAuthProviders = dynamic(() => import('components/interfaces/Auth/CustomAuthProviders'))

const ProvidersPage: NextPageWithLayout = () => {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')
  const showCustomProviders = useIsFeatureEnabled('authentication:show_custom_providers')

  return (
    <PageContainer size="default">
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
      {showCustomProviders && <CustomAuthProviders />}
    </PageContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ProvidersPage
