import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import type { CustomProvider } from './customProviders.types'

interface CreateOrUpdateCustomProviderSheetProps {
  visible: boolean
  providerToEdit?: CustomProvider
  onSuccess: (provider: CustomProvider) => void
  onCancel: () => void
}

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your custom provider')
    .max(100, 'Name must be less than 100 characters'),
  identifier: z
    .string()
    .min(1, 'Please provide an identifier')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Identifier can only contain letters, numbers, hyphens, and underscores'
    ),
  provider_type: z.enum(['oidc', 'oauth2']).default('oidc'),
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().min(1, 'Client secret is required'),
})

const FORM_ID = 'create-or-update-custom-provider-form'

const initialValues = {
  name: '',
  identifier: '',
  provider_type: 'oidc' as const,
  client_id: '',
  client_secret: '',
}

export const CreateOrUpdateCustomProviderSheet = ({
  visible,
  providerToEdit,
  onSuccess,
  onCancel,
}: CreateOrUpdateCustomProviderSheetProps) => {
  const isEditMode = !!providerToEdit

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (visible) {
      if (providerToEdit) {
        form.reset({
          name: providerToEdit.name,
          identifier: providerToEdit.identifier.replace('custom:', ''),
          provider_type: providerToEdit.provider_type,
          client_id: providerToEdit.client_id,
          client_secret: '********',
        })
      } else {
        form.reset(initialValues)
      }
    }
  }, [visible, providerToEdit, form])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    // Mock implementation - in real app this would call the API
    const mockProvider: CustomProvider = {
      id: providerToEdit?.id || `mock-${Date.now()}`,
      provider_type: data.provider_type,
      identifier: `custom:${data.identifier}`,
      name: data.name,
      client_id: data.client_id,
      scopes: ['openid', 'email', 'profile'],
      pkce_enabled: true,
      enabled: true,
      email_optional: false,
      ...(data.provider_type === 'oidc' && {
        issuer: 'https://example.com',
        skip_nonce_check: false,
      }),
      ...(data.provider_type === 'oauth2' && {
        authorization_url: 'https://example.com/oauth/authorize',
        token_url: 'https://example.com/oauth/token',
        userinfo_url: 'https://example.com/oauth/userinfo',
      }),
      created_at: providerToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    toast.success(
      `Successfully ${isEditMode ? 'updated' : 'created'} custom provider "${data.name}"`
    )
    onSuccess(mockProvider)
  }

  const onClose = () => {
    form.reset(initialValues)
    onCancel()
  }

  return (
    <Sheet open={visible} onOpenChange={() => onCancel()}>
      <SheetContent
        size="lg"
        showClose={false}
        className="flex flex-col gap-0"
        tabIndex={undefined}
      >
        <SheetHeader>
          <div className="flex flex-row gap-3 items-center">
            <SheetClose
              className={cn(
                'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none data-[state=open]:bg-secondary',
                'transition'
              )}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="truncate">
              {isEditMode ? 'Update Custom Auth Provider' : 'Create a new Custom Auth Provider'}
            </SheetTitle>
          </div>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form className="flex-grow" onSubmit={form.handleSubmit(onSubmit)} id={FORM_ID}>
            <SheetSection className="overflow-auto flex-grow px-5 space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout label="Name" description="Human friendly display name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Provider name" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItemLayout
                    label="Identifier"
                    description="Human-readable identifier (used in API: custom:{identifier})"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="identifier_text"
                        disabled={isEditMode}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="provider_type"
                render={({ field }) => (
                  <FormItemLayout label="Type">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEditMode}
                      >
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ placeholder="Select provider type" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="oidc">OIDC</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="oauth2">OAuth2</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <SheetSection className="overflow-auto flex-grow px-5 space-y-6 border-t">
              <FormField_Shadcn_
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItemLayout label="Client ID">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Client ID" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="client_secret"
                render={({ field }) => (
                  <FormItemLayout label="Client Secret">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} type="password" placeholder="Client secret" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button htmlType="submit" form={FORM_ID}>
            {isEditMode ? 'Update provider' : 'Create provider'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
