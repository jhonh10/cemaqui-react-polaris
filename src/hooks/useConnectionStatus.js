import { useState, useEffect, useRef } from 'react';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const lastOfflineTime = useRef(0);
  const minOfflineDuration = 1500; // Mínimo tiempo que debe pasar entre offline->online (ms)

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Detector: Evento 'online' recibido del navegador");
      
      // Evitar falsos positivos: verificar si realmente ha pasado suficiente tiempo offline
      const timeSinceOffline = Date.now() - lastOfflineTime.current;
      
      if (timeSinceOffline < minOfflineDuration) {
        console.log(`⚠️ Ignorando evento 'online' demasiado rápido (${timeSinceOffline}ms)`);
        return;
      }
      
      // Verificar realmente si hay conexión antes de cambiar el estado
      clearTimeout(reconnectTimeoutRef.current);
      
      // Intento de verificación de conectividad real
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("🔍 Verificando conexión real...");
          
          // Intentar una petición real (con timeout bajo)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const testResponse = await fetch('/ping', { 
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          }).catch(() => ({ ok: false }));
          
          clearTimeout(timeoutId);
          
          // Si la petición fue exitosa, consideramos que estamos realmente online
          if (testResponse.ok) {
            console.log("🌐 Detector: Conexión real confirmada");
            setIsOnline(true);
            
            // Marcar que estuvimos offline para poder realizar acciones de recuperación
            if (!isOnline) {
              setWasOffline(true);
              
              // Unificar con el evento appStateRestored
              setTimeout(() => {
                const currentPage = parseInt(
                  new URLSearchParams(window.location.search).get("page") || "1", 
                  10
                );
                
                console.log(`🌐 Disparando evento unificado de restauración para página ${currentPage}`);
                
                window.dispatchEvent(new CustomEvent('appStateRestored', { 
                  detail: { 
                    currentPage,
                    source: 'connectionHook',
                    timestamp: Date.now() 
                  } 
                }));
              }, 500);
            }
          } else {
            console.log("⚠️ Evento 'online' falso positivo - seguimos sin conexión");
            // Forzar a offline de nuevo si la petición falló
            if (navigator.onLine) {
              // El navegador sigue pensando que está online, pero no es así
              // Disparamos un evento offline manual
              window.dispatchEvent(new Event('offline'));
            }
          }
        } catch (error) {
          console.log("⚠️ Error verificando conexión:", error);
          // Si hay un error, asumimos que seguimos offline
          setIsOnline(false);
        }
      }, 1000); // Esperar 1 segundo antes de verificar la conexión
    };

    const handleOffline = () => {
      console.log("🌐 Detector: Conexión perdida");
      lastOfflineTime.current = Date.now();
      setIsOnline(false);
      
      // Limpiar cualquier timeout pendiente
      clearTimeout(reconnectTimeoutRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar también mediante ping periódico para detección más robusta
    const pingInterval = setInterval(async () => {
      try {
        // Solo intentar ping si el navegador cree que estamos online Y
        // nuestro estado interno también dice que estamos online
        if (navigator.onLine && isOnline) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const testResponse = await fetch('/ping', { 
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'Cache-Control': 'no-cache' }
          }).catch(() => ({ ok: false }));
          
          clearTimeout(timeoutId);
          
          if (!testResponse.ok) {
            console.log("🌐 Detector: Conexión inestable detectada por ping");
            setIsOnline(false);
            // Forzar offline si realmente no hay conexión
            window.dispatchEvent(new Event('offline'));
          }
        }
      } catch (error) {
        console.log("🌐 Detector: Error de ping - posible problema de conexión");
        setIsOnline(false);
        // Forzar offline si hay error de conexión
        window.dispatchEvent(new Event('offline'));
      }
    }, 30000); // Verificar cada 30 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [isOnline]);

  // Función para resetear el estado de "estuvimos offline"
  const resetWasOffline = () => {
    setWasOffline(false);
  };

  return { isOnline, wasOffline, resetWasOffline };
};

export default useConnectionStatus;