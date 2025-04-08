import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useReturningNavigation = () => {
  const location = useLocation();
  const [isReturningFromDetails, setIsReturningFromDetails] = useState(false);
  
  // Detectar el retorno desde página de detalles
  useEffect(() => {
    // Verificar ambas fuentes: history.state y sessionStorage
    const isReturningFromState = location.state?.fromList || 
                                window.history.state?.usr?.returningFromDetails;
    const isReturningFromSession = sessionStorage.getItem("returning_from_details") === "true";
    
    if (isReturningFromState || isReturningFromSession) {
      console.log("🔙 Detectado retorno desde página de detalles");
      setIsReturningFromDetails(true);
      
      // Limpiar el indicador en sessionStorage
      sessionStorage.removeItem("returning_from_details");
      
      // Limpiar el estado después de un tiempo
      const timer = setTimeout(() => {
        setIsReturningFromDetails(false);
        console.log("✅ Finalizado estado de retorno desde detalles");
      }, 1500); // Aumentado a 1.5 segundos para dar más margen
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [location.state]);
  
  return { isReturningFromDetails };
};