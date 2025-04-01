import React, { useCallback } from "react";
import { Button, HorizontalStack, Text } from "@shopify/polaris";

export const ListTablePagination = ({
  page,
  setPage,
  hasMore,
  setPageAction,
  isPreviousData,
  // Estas propiedades no se usan directamente en este componente,
  // pero se reciben para mantener consistencia con el sistema de paginación
  // basado en Firestore que requiere estos valores para funcionar correctamente.
  // Son utilizadas por getStudents() en client.js para el cursor-based pagination.
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible
}) => {
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
