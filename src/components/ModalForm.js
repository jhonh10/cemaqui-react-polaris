import { Modal } from '@shopify/polaris';

export const ModalForm = ({
  open,
  title,
  body,
  confirmAction,
  cancelAction,
  loading,
  disabled
}) => (
  <Modal
    open={open}
    title={title}
    onClose={cancelAction}
    primaryAction={{
      content: 'Guardar',
      onAction: confirmAction,
      loading,
      disabled
    }}
    secondaryActions={{
      content: 'Cerrar',
      onAction: cancelAction
    }}
  >
    <Modal.Section>{body}</Modal.Section>
  </Modal>
);
