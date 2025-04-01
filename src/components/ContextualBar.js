import { ContextualSaveBar } from "@shopify/polaris";

export default function ContextualBar({ handleSubmit, isSubmitting }) {
  return (
    <ContextualSaveBar
      message="Cambios sin guardar"
      saveAction={{
        onAction: handleSubmit,
        loading: isSubmitting,
      }}
      discardAction={{
        onAction: () => {},
      }}
    />
  );
}
