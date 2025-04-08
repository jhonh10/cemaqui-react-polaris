import React, { useState, useEffect, useRef } from "react";
import {
  EmptyState,
  Button,
  LegacyCard,
  Text,
  Badge,
  Spinner,
  HorizontalStack,
  Banner,
} from "@shopify/polaris";
import { useQueryClient } from "@tanstack/react-query";
import InactivitySimulator from "./InactivitySimulator";

// Eliminar esta importación que causa el problema
// import { useSearchParams } from 'react-router-dom';

export const OfflineUI = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectError, setReconnectError] = useState(null);
  const queryClient = useQueryClient();
  const autoReconnectTimeout = useRef(null);
  const lastReconnectAttempt = useRef(0);

  // Reemplazar useSearchParams por una alternativa que no dependa de Router
  // const [searchParams] = useSearchParams();

  // Alternativa sin dependencia de Router
  const getCurrentPage = () => {
    // Leer parámetros de URL sin usar hooks de React Router
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get("page") || "1", 10);
  };

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (autoReconnectTimeout.current) {
        clearTimeout(autoReconnectTimeout.current);
      }
    };
  }, []);

  // Modificamos este efecto para evitar bucles
  useEffect(() => {
    const handleOnline = () => {
      console.log("🔌 Conexión restaurada automáticamente por el navegador");

      // Evitar llamadas demasiado frecuentes
      const now = Date.now();
      if (now - lastReconnectAttempt.current < 3000) {
        console.log("⚠️ Ignorando evento online demasiado rápido");
        return;
      }

      // Solo intentar reconectar si no estamos ya en el proceso
      if (!isReconnecting) {
        handleReconnect(true); // pasamos true para indicar que es automático
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isReconnecting]);

  // Esta función verificará múltiples URLs para confirmar la conexión
  const verifyMultipleConnections = async () => {
    // Verificar múltiples dominios distintos para confirmar conexión real
    const testUrls = [
      'https://www.google.com/generate-204', // Google test URL
      'https://www.apple.com/library/test/success.html', // Apple test URL
      'https://www.cloudflare.com/cdn-cgi/trace', // Cloudflare test URL
      'https://httpbin.org/status/200' // Httpbin test URL
    ];
    
    // Usamos Promise.all para realizar solicitudes en paralelo - mejor que un bucle
    const results = await Promise.all(testUrls.map(async (url) => {
      try {
        console.log(`🔍 Verificando conexión con: ${url}`);
        
        // Agregar timestamp para prevenir caché
        const testUrl = `${url}${url.includes('?') ? '&' : '?'}nocache=${Date.now()}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(testUrl, {
          method: 'HEAD', // Solo pedimos cabeceras para rapidez
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Test-Time': Date.now().toString()
          }
        }).catch(err => {
          console.warn(`⚠️ Error verificando ${url}:`, err);
          return { ok: false };
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Conexión verificada con: ${url}`);
          return true;
        }
        return false;
      } catch (error) {
        console.warn(`❌ Error en prueba con ${url}:`, error);
        return false;
      }
    }));
    
    // Contamos cuántas solicitudes fueron exitosas
    const successCount = results.filter(success => success).length;
    
    // Requerimos al menos 2 éxitos para confirmar conexión
    return successCount >= 2;
  };

  const handleReconnect = async (isAuto = false) => {
    // Evitar múltiples intentos simultáneos
    if (isReconnecting) return;
    
    // Registrar este intento
    lastReconnectAttempt.current = Date.now();
    setIsReconnecting(true);
    setReconnectError(null);
    setReconnectAttempts(prevAttempts => prevAttempts + 1);

    try {
      console.log(`🔄 Intentando verificar conexión ${isAuto ? 'automáticamente' : 'manualmente'}...`);
      
      // Implementar verificación robusta de múltiples fuentes
      const connectionConfirmed = await verifyMultipleConnections();
      
      if (connectionConfirmed) {
        console.log("🔄 Conexión verificada de manera confiable. Procediendo con restauración...");
        
        // Restaurar estado
        const currentPage = getCurrentPage();
        
        try {
          // 1. Restaurar estado básico
          await restoreAppState(currentPage);
          
          // 2. Forzar evento online si realmente tenemos conexión
          if (!navigator.onLine) {
            window.dispatchEvent(new Event('online'));
          }
          
          // 3. Esperar a que termine el proceso de reconexión
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setIsReconnecting(false);
          setReconnectError(null);
        } catch (restoreError) {
          console.error("Error durante la restauración:", restoreError);
          setIsReconnecting(false);
          setReconnectError(`Error restaurando la aplicación: ${restoreError.message || "Error desconocido"}`);
        }
      } else {
        console.log("❌ No se pudo confirmar conexión a Internet");
        setIsReconnecting(false);
        setReconnectError("No se detectó conexión a Internet. Verifica tu conexión e intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error general durante verificación de conexión:", error);
      setIsReconnecting(false);
      setReconnectError(`Error al intentar reconectar: ${error.message || "Error desconocido"}`);
    }
  };

  // Nueva función para restaurar el estado completo de la app
  const restoreAppState = async (currentPage) => {
    console.log("🔄 Iniciando restauración del estado de la app");
    
    try {
      // 1. Limpiar completamente el caché y forzar recargar desde cero
      
      // 2. Reestablecer sesión y estado global
      sessionStorage.setItem('lastNavigationTime', Date.now().toString());
      
      // 3. Limpiar datos de paginación que podrían estar corruptos
      sessionStorage.removeItem('pagesInfo');
      
      // 4. Forzar carga limpia de página 1 primero
      await queryClient.prefetchQuery(["students", 1, null])
        .catch(err => {
          console.error("Error prefetching página 1:", err);
          throw new Error("No se pudo cargar los datos iniciales");
        });
      
      // 5. Si estamos en otra página, prefetch también
      if (currentPage > 1) {
        await queryClient.prefetchQuery(["students", currentPage, null])
          .catch(err => {
            console.error(`Error prefetching página ${currentPage}:`, err);
            // No fallamos aquí, al menos tenemos página 1
          });
      }
      
      // 6. Exponer el evento para que otros componentes actúen
      window.dispatchEvent(new CustomEvent('appStateRestored', { 
        detail: { 
          currentPage,
          source: 'offlineUI',
          timestamp: Date.now()
        } 
      }));
      
      console.log("✅ Estado de la app restaurado correctamente");
      return true;
    } catch (error) {
      console.error("Error restaurando estado:", error);
      throw error; // Propagar el error para manejarlo en handleReconnect
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        padding: "20px",
      }}
    >
      <LegacyCard sectioned>
        <EmptyState
          heading="Sin conexión a internet"
          image="/offline-illustration.svg"
          imageContained
        >
          <p style={{ marginBottom: "20px" }}>
            No se pudo establecer conexión con el servidor. Verifica tu conexión
            a internet e intenta nuevamente.
          </p>

          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Badge status="warning">Sin conexión</Badge>
            {reconnectAttempts > 0 && (
              <Badge>{reconnectAttempts} intentos de reconexión</Badge>
            )}
          </div>

          {reconnectError && (
            <Banner
              status="critical"
              title="Error de reconexión"
              style={{ marginBottom: "20px" }}
            >
              <p>{reconnectError}</p>
            </Banner>
          )}

          <Button
            primary
            loading={isReconnecting}
            onClick={() => handleReconnect(false)}
            disabled={isReconnecting}
          >
            {isReconnecting
              ? "Intentando reconectar..."
              : "Intentar reconectar ahora"}
          </Button>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Text variant="bodySm" color="subdued">
              La aplicación intentará reconectarse automáticamente cuando
              detecte conexión.
              {isReconnecting && (
                <span style={{ marginLeft: "8px" }}>
                  <Spinner size="small" />
                </span>
              )}
            </Text>
          </div>
        </EmptyState>
      </LegacyCard>

      {/* Mantenemos visible el simulador de inactividad para pruebas */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Text variant="headingMd" as="h3">
            Herramientas de prueba
          </Text>
          <HorizontalStack
            gap="3"
            wrap={false}
            align="center"
            blockAlign="center"
          >
            <div style={{ marginTop: "10px" }}>
              <InactivitySimulator showOfflineControls />
            </div>
          </HorizontalStack>
          <Text variant="bodySm" color="subdued" as="p" alignment="center">
            Estas herramientas son solo para desarrollo y pruebas.
          </Text>
        </div>
      )}
    </div>
  );
};

export default OfflineUI;
