import ReactRouterPrompt from "react-router-prompt";
import ModalConfirm from "./ModalConfirm";

function ModalPrompt({isDirty}) {
  return (
    <ReactRouterPrompt when={isDirty}>
      {({ isActive, onConfirm, onCancel }) => (
        <ModalConfirm
          open={isActive}
          confirmAction={onConfirm}
          cancelAction={onCancel}
          title="¿Salir de la página sin guardar los cambios?"
          primaryActionTitle="Abandonar pagina"
          secondaryActionTitle="Permanecer"
          bodyText="Al salir de esta página, se eliminarán todos los cambios sin guardar."
        />
      )}
    </ReactRouterPrompt>
  );
}

export default ModalPrompt;
