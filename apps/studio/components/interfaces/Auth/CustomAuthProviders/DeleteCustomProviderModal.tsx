import type { CustomProvider } from './customProviders.types'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteCustomProviderModalProps {
  visible: boolean
  selectedProvider?: CustomProvider
  setVisible: (value: string | null) => void
  onDelete: (providerId: string) => void
  isLoading: boolean
}

export const DeleteCustomProviderModal = ({
  visible,
  selectedProvider,
  setVisible,
  onDelete,
  isLoading,
}: DeleteCustomProviderModalProps) => {
  const onConfirmDeleteProvider = () => {
    if (selectedProvider) {
      onDelete(selectedProvider.id)
    }
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isLoading}
      visible={visible}
      title={
        <>
          Confirm to delete custom provider{' '}
          <code className="text-sm">{selectedProvider?.name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={() => setVisible(null)}
      onConfirm={() => onConfirmDeleteProvider()}
      alert={{
        title: 'This action cannot be undone',
        description:
          'You will need to re-create the custom provider if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this custom provider, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          Any users authenticating with this provider will lose access
        </li>
        <li className="list-disc ml-6">
          This provider is no longer in use by any applications
        </li>
      </ul>
    </ConfirmationModal>
  )
}
