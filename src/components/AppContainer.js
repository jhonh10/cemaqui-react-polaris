import React, { useEffect, useState } from "react";
import { Frame, Banner } from "@shopify/polaris";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { OfflineUI } from "./OfflineUi";
import { restoreCursorsFromPagesInfo } from "../firebase/client";

export const AppContainer = ({ children }) => {
  const { isOnline, wasOffline, resetWasOffline } = useConnectionStatus();
  const [showOfflineUI, setShowOfflineUI] = useState(false);

  // Usar un efecto separado para controlar la visualización del OfflineUI
  // para evitar parpadeos o cambios rápidos
  useEffect(() => {
    let timeoutId;

    if (!isOnline) {
      // Mostrar OfflineUI después de un pequeño retraso
      // para evitar falsos positivos
      timeoutId = setTimeout(() => {
        setShowOfflineUI(true);
      }, 1000);
    } else {
      // Si volvemos a estar online, esperar un poco antes de quitar OfflineUI
      timeoutId = setTimeout(() => {
        setShowOfflineUI(false);
      }, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [isOnline]);

  // Simplificar el efecto de reconexión
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log("🔄 Recuperación después de período sin conexión");

      // Restaurar cursores desde pagesInfo
      restoreCursorsFromPagesInfo();

      // Limpiar UI después de un momento
      setTimeout(() => {
        resetWasOffline();
      }, 5000);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Si no hay conexión, mostrar UI de desconexión
  if (showOfflineUI) {
    return <OfflineUI />;
  }

  return (
    <Frame>
      {wasOffline && (
        <Banner
          title="Conexión restaurada"
          status="success"
          onDismiss={() => resetWasOffline()}
        >
          <p>
            La conexión a internet ha sido restaurada. Los datos se han
            actualizado automáticamente.
          </p>
        </Banner>
      )}
      {children}
    </Frame>
  );
};

export default AppContainer;
