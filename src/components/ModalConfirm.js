import { Modal, TextContainer } from '@shopify/polaris';

export default function ModalConfirm({ showDialog, cancelNavigation, confirmNavigation }) {
  return (
    <Modal
      open={showDialog}
      onClose={cancelNavigation}
      title="¿Salir de la página sin guardar los cambios?"
      primaryAction={{
        content: 'Abandonar página',
        onAction: confirmNavigation,
        destructive: true
      }}
      secondaryActions={[
        {
          content: 'Permanecer',
          onAction: cancelNavigation
        }
      ]}
    >
      <Modal.Section>
        <TextContainer>
          <p>Al salir de esta página, se eliminarán todos los cambios sin guardar.</p>
        </TextContainer>
      </Modal.Section>
    </Modal>
  );
}
