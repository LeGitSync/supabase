import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { PROVIDERS_SCHEMAS, getPhoneProviderValidationSchema } from '../AuthProvidersFormValidation'
import { CustomAuthProvidersList } from './CustomAuthProvidersList'

const CustomAuthProviders = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Custom Providers</PageSectionTitle>
          <PageSectionDescription>
            Configure OAuth/OIDC providers for this project using your own issuer or endpoints.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {isError ? (
          <AlertError
            error={authConfigError}
            subject="Failed to retrieve auth configuration for hooks"
          />
        ) : (
          <div className="-space-y-px">
            <CustomAuthProvidersList />
          </div>
        )}
      </PageSectionContent>
    </PageSection>
  )
}

export default CustomAuthProviders
