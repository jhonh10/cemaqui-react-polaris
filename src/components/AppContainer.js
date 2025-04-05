import React, { useEffect, useState } from "react";
import { Frame, Banner } from "@shopify/polaris";
import { useQueryClient } from "@tanstack/react-query";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { OfflineUI } from "./OfflineUi";

export const AppContainer = ({ children }) => {
  const { isOnline, wasOffline, resetWasOffline } = useConnectionStatus();
  const queryClient = useQueryClient();
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

  // Recuperación cuando volvemos a estar online después de un período offline
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log("🔄 Recuperación después de período sin conexión");
      
      // Dar tiempo para que Firebase restablezca sus conexiones
      setTimeout(() => {
        // 1. Invalidar queries para forzar recarga
        queryClient.resetQueries();
        
        // 2. Prefetch de la página actual
        const currentPage = parseInt(
          new URLSearchParams(window.location.search).get("page") || "1", 
          10
        );
        
        console.log(`🔄 Prefetching página ${currentPage} después de reconexión`);
        
        // 3. Prefetch de página 1 primero (para establecer cursores base)
        queryClient.prefetchQuery(["students", 1, null])
          .then(() => {
            // 4. Luego prefetch de la página actual si es distinta de 1
            if (currentPage > 1) {
              return queryClient.prefetchQuery(["students", currentPage, null]);
            }
          })
          .catch(error => {
            console.error("Error en prefetch después de reconexión:", error);
          });
        
        // 5. Resetear flag "estuvimos offline" después de completar operaciones
        setTimeout(() => {
          resetWasOffline();
        }, 2000);
      }, 1500); // Esperar un poco más para dar tiempo a Firebase
    }
  }, [isOnline, wasOffline, queryClient, resetWasOffline]);

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
          <p>La conexión a internet ha sido restaurada. Los datos se han actualizado automáticamente.</p>
        </Banner>
      )}
      {children}
    </Frame>
  );
};

export default AppContainer;
