import React, { useCallback, useEffect, useState } from "react";
import { Button, HorizontalStack, Text } from "@shopify/polaris";
import { useSearchParams, useNavigate } from "react-router-dom";
import InactivitySimulator from "./InactivitySimulator";
import {
  CURSOR_STORAGE_KEY,
  getCursorForPage,
  ensurePageCursors,
  restoreCursorsFromPagesInfo,
} from "../firebase/client";

const ListTablePagination = ({
  page,
  hasMore,
  isPreviousData,
  setPage,
  setPageAction,
  isSearchActive = false,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  // Añadir esta variable de estado
  const [maxKnownPage, setMaxKnownPage] = useState(1);

  // Añadir este efecto para calcular maxKnownPage desde pagesInfo
  useEffect(() => {
    try {
      const pagesInfo = JSON.parse(sessionStorage.getItem("pagesInfo") || "{}");
      const pageKeys = Object.keys(pagesInfo);

      if (pageKeys.length > 0) {
        // Convertir a números y encontrar el máximo
        const numericKeys = pageKeys.map((key) => parseInt(key, 10));
        const maxPage = Math.max(...numericKeys);

        // Solo actualizar si el valor calculado es mayor que el actual
        if (maxPage > maxKnownPage) {
          setMaxKnownPage(maxPage);
        }
      }

      // También actualizar si la página actual es mayor que maxKnownPage
      // pero solo si hasMore es false (significa que es la última página)
      if (page > maxKnownPage && !hasMore) {
        setMaxKnownPage(page);
      }
    } catch (error) {
      console.error("Error calculando maxKnownPage:", error);
    }
  }, [page, hasMore, maxKnownPage]);

  // Modificar el useEffect que actualiza la URL
  useEffect(() => {
    // Solo aplicar cuando no hay búsqueda activa y cuando la página cambia genuinamente (no al montar)
    if (!isSearchActive) {
      const params = new URLSearchParams(searchParams);
      const currentPageParam = params.get("page");
      const currentPageNumber = currentPageParam
        ? parseInt(currentPageParam, 10)
        : 1;

      // Evitar actualizaciones innecesarias al montar o si ya estamos en la página correcta
      if (page === currentPageNumber) {
        return;
      }

      console.log(
        `📝 Actualizando URL: Cambiando página de ${currentPageNumber} a ${page}`
      );

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

  // Implementación mejorada de handlePageChange
  const handlePageChange = useCallback(
    (newPage) => {
      console.log(
        `📝 Actualizando URL: Cambiando página de ${page} a ${newPage}`
      );

      // Verificar si estamos haciendo un salto grande
      const isLargeJump = Math.abs(newPage - page) > 1;

      // Verificar si estamos retrocediendo
      const isGoingBack = newPage < page;

      // Verificar si tenemos cursores almacenados para ese salto
      let hasCursors = false;
      try {
        const storedCursors = sessionStorage.getItem(CURSOR_STORAGE_KEY);
        if (storedCursors) {
          const cursorsObj = JSON.parse(storedCursors);
          hasCursors = Boolean(cursorsObj[newPage]);
        }
      } catch (error) {
        console.error("Error verificando cursores:", error);
      }

      // Si hacemos un salto grande o retrocedemos sin cursores, forzar reconstrucción
      if ((isLargeJump || (isGoingBack && !hasCursors)) && newPage > 1) {
        console.log(
          `⚠️ Detectada navegación compleja (${
            isLargeJump ? "salto grande" : "retroceso sin cursores"
          })`
        );
        console.log(
          `🔄 Forzando reconstrucción secuencial para garantizar integridad`
        );

        // Estrategia 1: Reconstrucción secuencial para evitar huecos en cursores
        sessionStorage.setItem("forcePageRebuild", "true");
        sessionStorage.setItem("targetRebuildPage", newPage.toString());

        // Establecer bandera especial para indicar reconstrucción secuencial
        sessionStorage.setItem("sequentialRebuild", "true");

        // Siempre empezar desde página 1 para reconstrucción completa
        navigate("?page=1", { replace: true });

        return;
      }

      // Navegación normal para casos simples
      navigate(`?page=${newPage}`);
    },
    [navigate, page]
  );

  const handleNextPage = useCallback(() => {
    if (!isPreviousData && hasMore && !isNavigating) {
      // Restaurar cursores desde pagesInfo para mantener consistencia
      restoreCursorsFromPagesInfo();

      // Guardar tiempo de última navegación
      sessionStorage.setItem("lastNavigationTime", Date.now().toString());

      // Verificar tiempo desde última navegación
      const lastNavTime = parseInt(
        sessionStorage.getItem("lastNavigationTime") || "0",
        10
      );
      const inactiveTime = Date.now() - lastNavTime;
      const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutos

      // Si ha pasado mucho tiempo, alertar en consola
      if (inactiveTime > STALE_THRESHOLD) {
        console.log(
          `⚠️ Primera navegación después de ${Math.round(
            inactiveTime / 60000
          )} minutos de inactividad`
        );
      }

      setIsNavigating(true);
      setPageAction("next");
      setPage((prevPage) => prevPage + 1);

      setTimeout(() => {
        setIsNavigating(false);
      }, 500); // 500ms debería ser suficiente para evitar doble click
    }
  }, [hasMore, isPreviousData, setPage, setPageAction, isNavigating]);

  // Mejorar el handlePreviousPage para verificar cursores antes de navegar hacia atrás
  const handlePreviousPage = useCallback(() => {
    if (page > 1 && !isNavigating) {
      // Restaurar cursores desde pagesInfo para mantener consistencia
      restoreCursorsFromPagesInfo();

      // Actualizar tiempo de navegación
      sessionStorage.setItem("lastNavigationTime", Date.now().toString());

      // Verificar tiempo desde última navegación para detectar inactividad
      const lastNavTime = parseInt(
        sessionStorage.getItem("lastNavigationTime") || "0",
        10
      );
      const inactiveTime = Date.now() - lastNavTime;
      const STALE_THRESHOLD = 5 * 60 * 1000;

      if (inactiveTime > STALE_THRESHOLD) {
        console.log(
          `⚠️ Primera navegación después de ${Math.round(
            inactiveTime / 60000
          )} minutos de inactividad`
        );
      }

      // Verificar cursores para página anterior
      try {
        const cursorExists = Boolean(getCursorForPage(page - 1));

        if (!cursorExists && page > 2) {
          console.log(
            `⚠️ Falta cursor para página ${
              page - 1
            }, forzando reconstrucción segura`
          );

          // Establecer estado de navegación para prevenir clics múltiples
          setIsNavigating(true);

          // Usar nuestra función auxiliar para asegurar cursores
          ensurePageCursors(page - 1)
            .then((success) => {
              if (success) {
                // Navegación normal después de asegurar cursores
                setPageAction("previous");
                setPage((prevPage) => prevPage - 1);

                setTimeout(() => {
                  setIsNavigating(false);
                }, 500);
              } else {
                // Si falla, ir a una página segura
                console.log(
                  "⚠️ No se pudieron reconstruir cursores, navegando a página 1"
                );
                setPageAction(null);
                setPage(1);

                setTimeout(() => {
                  setIsNavigating(false);
                }, 500);
              }
            })
            .catch(() => {
              // En caso de error, volver a página 1
              setPageAction(null);
              setPage(1);
              setIsNavigating(false);
            });

          return;
        }
      } catch (error) {
        console.error("Error verificando cursores:", error);
        // Continuar con navegación normal en caso de error de verificación
      }

      // Navegación normal si tenemos cursores o estamos en página 2
      setIsNavigating(true);
      setPageAction("previous");
      setPage((prevPage) => prevPage - 1);

      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }
  }, [page, setPage, setPageAction, isNavigating]);

  // Renderizar componente según modo
  if (isSearchActive) {
    return (
      <div
        style={{ padding: "16px", display: "flex", justifyContent: "center" }}
      >
        <Text variant="bodyMd">Mostrando resultados de búsqueda</Text>
        {process.env.NODE_ENV === "development" && <InactivitySimulator />}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text variant="bodyMd">Página {page}</Text>
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
      {process.env.NODE_ENV === "development" && <InactivitySimulator />}
    </div>
  );
};

export default ListTablePagination;
