import React, { useCallback, useEffect } from "react";
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
  
  // Actualizar la URL cuando cambia la página
  useEffect(() => {
    // Solo aplicar cuando no hay búsqueda activa
    if (!isSearchActive) {
      const params = new URLSearchParams(searchParams);
      
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
      
      // Evitar actualización cíclica comparando URLs
      const newUrl = params.toString();
      const currentUrl = searchParams.toString();
      
      if (newUrl !== currentUrl) {
        setSearchParams(params);
      }
    }
  }, [page, searchParams, setSearchParams, isSearchActive]);

  const handleNextPage = useCallback(() => {
    if (!isPreviousData && hasMore) {
      setPageAction("next");
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMore, isPreviousData, setPage, setPageAction]);

  const handlePreviousPage = useCallback(() => {
    if (page > 1) {
      setPageAction("previous");
      setPage(prevPage => prevPage - 1);
    }
  }, [page, setPage, setPageAction]);

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
          disabled={page <= 1 || isPreviousData}
        >
          Anterior
        </Button>
        <Button 
          onClick={handleNextPage} 
          disabled={isPreviousData || !hasMore}
        >
          Siguiente
        </Button>
      </HorizontalStack>
    </div>
  );
};
