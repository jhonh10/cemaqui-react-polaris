import { Modal, TextContainer, VerticalStack } from '@shopify/polaris';

export default function ModalConfirm({
  open,
  cancelAction,
  confirmAction,
  title,
  primaryActionTitle,
  secondaryActionTitle,
  bodyText,
  loading
}) {
  return (
    <Modal
      open={open}
      onClose={cancelAction}
      title={title}
      primaryAction={{
        content: primaryActionTitle,
        onAction: confirmAction,
        destructive: true,
        loading
      }}
      secondaryActions={[
        {
          content: secondaryActionTitle,
          onAction: cancelAction
        }
      ]}
    >
      <Modal.Section>
        <VerticalStack>
          <p>{bodyText}</p>
        </VerticalStack>
      </Modal.Section>
    </Modal>
  );
}
