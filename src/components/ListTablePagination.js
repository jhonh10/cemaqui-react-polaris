import React, { useCallback, useEffect, useState } from "react";
import { Button, HorizontalStack, Text } from "@shopify/polaris";
import { useSearchParams } from "react-router-dom";

export const ListTablePagination = ({
  page,
  setPage,
  hasMore,
  setPageAction,
  isPreviousData,
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible,
  isSearchActive
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Modificar el useEffect que actualiza la URL
  useEffect(() => {
    // Solo aplicar cuando no hay búsqueda activa y cuando la página cambia genuinamente (no al montar)
    if (!isSearchActive) {
      const params = new URLSearchParams(searchParams);
      const currentPageParam = params.get("page");
      const currentPageNumber = currentPageParam ? parseInt(currentPageParam, 10) : 1;
      
      // Evitar actualizaciones innecesarias al montar o si ya estamos en la página correcta
      if (page === currentPageNumber) {
        return;
      }
      
      console.log(`📝 Actualizando URL: Cambiando página de ${currentPageNumber} a ${page}`);
      
      // Mantener query si existe
      const currentQuery = params.get("query") || "";
      if (currentQuery) {
        params.set("query", currentQuery);
      }
      
      // Mantener _prevPage si existe
      const prevPage = params.get("_prevPage");
      
      // Actualizar parámetro de página
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      
      // Restaurar _prevPage si existía
      if (prevPage) {
        params.set("_prevPage", prevPage);
      }
      
      setSearchParams(params);
    }
  }, [page, searchParams, setSearchParams, isSearchActive]);

  const handleNextPage = useCallback(() => {
    if (!isPreviousData && hasMore && !isNavigating) {
      // Guardar tiempo de última navegación
      sessionStorage.setItem('lastNavigationTime', Date.now().toString());
      
      // Verificar tiempo desde última navegación
      const lastNavTime = parseInt(sessionStorage.getItem('lastNavigationTime') || '0', 10);
      const inactiveTime = Date.now() - lastNavTime;
      const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutos
      
      // Si ha pasado mucho tiempo, alertar en consola
      if (inactiveTime > STALE_THRESHOLD) {
        console.log(`⚠️ Primera navegación después de ${Math.round(inactiveTime/60000)} minutos de inactividad`);
      }
      
      setIsNavigating(true);
      setPageAction("next");
      setPage(prevPage => prevPage + 1);
      
      setTimeout(() => {
        setIsNavigating(false);
      }, 500); // 500ms debería ser suficiente para evitar doble click
    }
  }, [hasMore, isPreviousData, setPage, setPageAction, isNavigating]);

  const handlePreviousPage = useCallback(() => {
    if (page > 1 && !isNavigating) {
      // Actualizar tiempo de navegación
      sessionStorage.setItem('lastNavigationTime', Date.now().toString());
      
      // Verificar tiempo desde última navegación
      const lastNavTime = parseInt(sessionStorage.getItem('lastNavigationTime') || '0', 10);
      const inactiveTime = Date.now() - lastNavTime;
      const STALE_THRESHOLD = 5 * 60 * 1000;
      
      if (inactiveTime > STALE_THRESHOLD) {
        console.log(`⚠️ Primera navegación después de ${Math.round(inactiveTime/60000)} minutos de inactividad`);
      }
      
      setIsNavigating(true);
      setPageAction("previous");
      setPage(prevPage => prevPage - 1);
      
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }
  }, [page, setPage, setPageAction, isNavigating]);

  // Si hay búsqueda activa, mostrar un mensaje diferente
  if (isSearchActive) {
    return (
      <div style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
        <Text variant="bodyMd">
          Mostrando resultados de búsqueda
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Text variant="bodyMd">
        Página {page}
      </Text>
      <HorizontalStack gap="3">
        <Button 
          onClick={handlePreviousPage} 
          disabled={page <= 1 || isPreviousData || isNavigating}
        >
          Anterior
        </Button>
        <Button 
          onClick={handleNextPage} 
          disabled={isPreviousData || !hasMore || isNavigating}
        >
          Siguiente
        </Button>
      </HorizontalStack>
    </div>
  );
};
