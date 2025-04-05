import React, { useState, useEffect } from "react";
import { Modal, TextContainer, Button, ButtonGroup, Text, HorizontalStack, Banner } from "@shopify/polaris";

const InactivitySimulator = ({ showOfflineControls = false }) => {
  const [active, setActive] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulatedMinutes, setSimulatedMinutes] = useState(10);
  const [isOffline, setIsOffline] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(0);
  
  // Comprobar el estado de conexión al iniciar
  useEffect(() => {
    const originalOnline = navigator.onLine;
    return () => {
      // Si cambiamos el estado de conexión, restaurarlo al desmontar
      if (originalOnline !== navigator.onLine) {
        // Simulamos que el navegador vuelve a estar online
        window.dispatchEvent(new Event('online'));
      }
    };
  }, []);
  
  // Función para simular inactividad
  const simulateInactivity = () => {
    setSimulating(true);
    
    // Guardar el timestamp actual
    const originalTimestamp = Date.now();
    console.log("⏱️ Estado original antes de simular inactividad:", {
      lastActivityTimestamp: originalTimestamp,
      sessionLastNav: sessionStorage.getItem('lastNavigationTime'),
      currentPage: new URLSearchParams(window.location.search).get("page") || "1"
    });
    
    // Calcular el nuevo timestamp (retrocedido en el tiempo)
    const minutesInMs = simulatedMinutes * 60 * 1000;
    const simulatedTimestamp = originalTimestamp - minutesInMs;
    
    // Actualizar todos los registros de tiempo relevantes
    if (window.lastActivityTimestamp) {
      window.lastActivityTimestamp = simulatedTimestamp;
    }
    
    // Actualizar sessionStorage
    sessionStorage.setItem('lastNavigationTime', simulatedTimestamp.toString());
    
    // Simular el paso del tiempo en el hook useFetchStudents (accediendo a variables expuestas)
    if (window._debugHooks && window._debugHooks.useFetchStudents) {
      const hook = window._debugHooks.useFetchStudents;
      if (hook.setLastActivityTimestamp) {
        hook.setLastActivityTimestamp(simulatedTimestamp);
      }
    }
    
    console.log(`⏱️ Simulados ${simulatedMinutes} minutos de inactividad`);
    console.log("⏱️ Nuevos valores de timestamp:", {
      simulatedTimestamp,
      difference: `${simulatedMinutes} minutos atrás`
    });
    
    setTimeout(() => {
      setSimulating(false);
      setActive(false);
    }, 1500);
  };

  // Función para simular caída de conexión
  const simulateConnectionLoss = () => {
    if (isOffline) return;
    
    console.log("🔌 Simulando pérdida de conexión...");
    
    // Disparar evento de desconexión
    window.dispatchEvent(new Event('offline'));
    setIsOffline(true);
    
    // Cambiar propiedad navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get() { return false; }
    });
    
    // Invalidar peticiones fetch
    const originalFetch = window.fetch;
    window.fetch = () => Promise.reject(new Error('Failed to fetch: No internet connection'));
    
    // Guardar referencia para restaurar después
    window._originalFetch = originalFetch;
  };
  
  // Modificar la función simulateReconnection para incluir restauración de estado
  const simulateReconnection = (seconds = 5) => {
    if (!isOffline) return;
    
    console.log(`🔌 Reconectando en ${seconds} segundos...`);
    setReconnectCountdown(seconds);
    
    const countdownInterval = setInterval(() => {
      setReconnectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Restaurar conexión
          Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get() { return true; }
          });
          
          // Restaurar fetch
          if (window._originalFetch) {
            window.fetch = window._originalFetch;
            window._originalFetch = undefined;
          }
          
          // Restaurar estado de la aplicación
          console.log("🔌 Preparando restauración completa del estado...");
          
          // 1. Actualizar el timestamp de actividad
          sessionStorage.setItem('lastNavigationTime', Date.now().toString());
          
          // 2. Limpiar caché de paginación que podría estar corrupta
          sessionStorage.removeItem('pagesInfo');
          
          // 3. Restaurar conexión con orden mejor definido
          // Primero restaurar fetch API
          if (window._originalFetch) {
            window.fetch = window._originalFetch;
            window._originalFetch = undefined;
          }

          // Luego restaurar propiedad navigator.onLine
          Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get() { return true; }
          });

          // Finalmente disparar eventos DESPUÉS de preparar todo
          setTimeout(() => {
            const currentPage = parseInt(
              new URLSearchParams(window.location.search).get("page") || "1", 
              10
            );
            
            // Primero el evento personalizado que controla la lógica de restauración
            window.dispatchEvent(new CustomEvent('appStateRestored', { 
              detail: { 
                currentPage,
                source: 'simulator',
                timestamp: Date.now()
              } 
            }));
            
            // Después el evento estándar online (que desencadenará otras acciones)
            setTimeout(() => {
              window.dispatchEvent(new Event('online'));
              console.log("🔌 Conexión restaurada con estado limpio");
              setIsOffline(false);
            }, 100);
          }, 100);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (value) => {
    setSimulatedMinutes(parseInt(value, 10) || 10);
  };

  // Si estamos en la vista offline y no se nos pide mostrar los controles específicos, mostrar solo el botón de reconexión
  if (showOfflineControls) {
    return (
      <div>
        <Button 
          onClick={() => simulateReconnection(5)} 
          primary
          size="medium"
        >
          Forzar reconexión (test)
        </Button>
        <div style={{ marginTop: '10px' }}>
          <Button 
            onClick={() => setActive(true)} 
            size="slim"
          >
            Abrir herramientas de prueba
          </Button>
        </div>
        
        <Modal
          open={active}
          onClose={() => !simulating && setActive(false)}
          title="Simulador de Desarrollo"
          primaryAction={{
            content: simulating ? 'Simulando...' : 'Simular inactividad',
            onAction: simulateInactivity,
            loading: simulating,
            disabled: simulating || isOffline
          }}
          secondaryActions={[
            {
              content: 'Cerrar',
              onAction: () => setActive(false),
              disabled: simulating
            },
          ]}
        >
          <Modal.Section>
            {isOffline && (
              <Banner
                title="Simulando desconexión"
                status="critical"
                action={{
                  content: reconnectCountdown > 0 
                    ? `Reconectando en ${reconnectCountdown}s` 
                    : 'Reconectar ahora',
                  onAction: () => simulateReconnection(5),
                  disabled: reconnectCountdown > 0
                }}
              >
                <p>La aplicación está simulando no tener conexión a Internet. Los fetch y peticiones fallarán.</p>
              </Banner>
            )}
            
            <TextContainer>
              <p>Esta herramienta ayuda a simular condiciones especiales para probar la robustez de la aplicación.</p>
              
              <div style={{ marginTop: '20px' }}>
                <Text variant="headingMd">Simular inactividad</Text>
                <HorizontalStack gap="3" align="center" blockAlign="center">
                  <Text variant="bodyMd">Tiempo a simular:</Text>
                  <ButtonGroup segmented>
                    {[5, 10, 30, 60].map(minutes => (
                      <Button 
                        key={minutes}
                        pressed={simulatedMinutes === minutes}
                        onClick={() => handleChange(minutes)}
                        disabled={simulating || isOffline}
                      >
                        {minutes} min
                      </Button>
                    ))}
                  </ButtonGroup>
                </HorizontalStack>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <Text variant="headingMd">Simular problemas de conexión</Text>
                <HorizontalStack gap="3" wrap={false}>
                  <Button 
                    onClick={simulateConnectionLoss}
                    destructive
                    disabled={isOffline}
                  >
                    Simular desconexión
                  </Button>
                  <Button 
                    onClick={() => simulateReconnection(5)}
                    primary
                    disabled={!isOffline || reconnectCountdown > 0}
                  >
                    Simular reconexión
                  </Button>
                </HorizontalStack>
              </div>
            </TextContainer>
          </Modal.Section>
        </Modal>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <Button
          onClick={() => setActive(true)}
          primary={!isOffline}
          destructive={isOffline}
          size="slim"
          icon={
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8-8-3.589 8-8 8zm1-13h-2v5H7v2h2v2h2v-2h2v-2h-2V5z" fill="currentColor"/>
            </svg>
          }
        >
          {isOffline ? `Sin conexión (${reconnectCountdown})` : 'Test Inactividad'}
        </Button>
      </div>

      <Modal
        open={active}
        onClose={() => !simulating && setActive(false)}
        title="Simulador de Desarrollo"
        primaryAction={{
          content: simulating ? 'Simulando...' : 'Simular inactividad',
          onAction: simulateInactivity,
          loading: simulating,
          disabled: simulating || isOffline
        }}
        secondaryActions={[
          {
            content: 'Cancelar',
            onAction: () => setActive(false),
            disabled: simulating
          },
        ]}
      >
        <Modal.Section>
          {isOffline && (
            <Banner
              title="Simulando desconexión"
              status="critical"
              action={{
                content: reconnectCountdown > 0 
                  ? `Reconectando en ${reconnectCountdown}s` 
                  : 'Reconectar ahora',
                onAction: () => simulateReconnection(5),
                disabled: reconnectCountdown > 0
              }}
            >
              <p>La aplicación está simulando no tener conexión a Internet. Los fetch y peticiones fallarán.</p>
            </Banner>
          )}
          
          <TextContainer>
            <p>Esta herramienta ayuda a simular condiciones especiales para probar la robustez de la aplicación.</p>
            
            <div style={{ marginTop: '20px' }}>
              <Text variant="headingMd">Simular inactividad</Text>
              <HorizontalStack gap="3" align="center" blockAlign="center">
                <Text variant="bodyMd">Tiempo a simular:</Text>
                <ButtonGroup segmented>
                  {[5, 10, 30, 60].map(minutes => (
                    <Button 
                      key={minutes}
                      pressed={simulatedMinutes === minutes}
                      onClick={() => handleChange(minutes)}
                      disabled={simulating || isOffline}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </ButtonGroup>
              </HorizontalStack>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <Text variant="headingMd">Simular problemas de conexión</Text>
              <HorizontalStack gap="3" wrap={false}>
                <Button 
                  onClick={simulateConnectionLoss}
                  destructive
                  disabled={isOffline}
                >
                  Simular desconexión
                </Button>
                <Button 
                  onClick={() => simulateReconnection(5)}
                  primary
                  disabled={!isOffline || reconnectCountdown > 0}
                >
                  Simular reconexión
                </Button>
              </HorizontalStack>
            </div>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </>
  );
};

export default InactivitySimulator;