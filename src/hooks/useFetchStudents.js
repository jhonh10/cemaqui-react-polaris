import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getStudents, searchStudents } from "../firebase/client";

// Constantes
const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

export const useFetchStudents = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("query") || "";

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [pageAction, setPageAction] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [maxKnownPage, setMaxKnownPage] = useState(1);
  
  // Estados para control de carga
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  // Estado para rastrear la última actividad
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState(Date.now());

  // Función para determinar si los cursores son probablemente obsoletos
  const areCursorsProbablyStale = useCallback(() => {
    const inactiveTime = Date.now() - lastActivityTimestamp;
    const MAX_CURSOR_VALIDITY = 5 * 60 * 1000; // 5 minutos
    return inactiveTime > MAX_CURSOR_VALIDITY;
  }, [lastActivityTimestamp]);

  // SOLUCIÓN: Al montar el componente, marcar como primer render
  useEffect(() => {
    // Este efecto se ejecuta solo una vez al montar
    console.log("🔄 Primer renderizado detectado");
    
    // Después de un breve tiempo, desactivar el flag de primer render
    const timer = setTimeout(() => {
      setIsFirstRender(false);
      console.log("✅ Finalizando estado de primer renderizado");
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Actualizar lastActivityTimestamp cuando hay interacción
  useEffect(() => {
    setLastActivityTimestamp(Date.now());
  }, [page, searchTerm, pageAction]);

  // Función para actualizar la URL con el número de página
  const updatePageInUrl = useCallback((pageNumber) => {
    const params = new URLSearchParams(searchParams);
    if (pageNumber === 1) {
      params.delete("page");
    } else {
      params.set("page", pageNumber.toString());
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Función para inicializar cursores para una carga limpia
  const resetCursors = useCallback(() => {
    setFirstVisible(null);
    setLastVisible(null);
    setPageAction(null);
  }, []);

  // Función para redirigir a una página específica
  const redirectToPage = useCallback((targetPage) => {
    console.log(`🔀 Redirigiendo a página ${targetPage}`);
    resetCursors();
    setPage(targetPage);
    updatePageInUrl(targetPage);
  }, [resetCursors, updatePageInUrl]);

  // 1. Efecto para inicializar desde URL
  useEffect(() => {
    if (!searchTerm && !initializedFromUrl) {
      const pageParam = searchParams.get("page");
      if (pageParam && !Number.isNaN(parseInt(pageParam, 10))) {
        const pageNumber = parseInt(pageParam, 10);
        console.log(`📄 Configurando página inicial a ${pageNumber} desde URL`);
        
        setInitializedFromUrl(true);
        setPage(pageNumber);
        
        if (pageNumber > 1) {
          console.log(`🔄 Reiniciando cursores para reconstruir la página ${pageNumber}`);
          resetCursors();
        }
      } else {
        console.log("📄 No hay página en URL, estableciendo página 1");
        setInitializedFromUrl(true);
        setPage(1);
      }
    }
  }, [searchParams, searchTerm, resetCursors, initializedFromUrl]);

  // 2. Efecto para manejar cambios en término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      queryClient.invalidateQueries(["studentsSearch"]);
    } else if (page === 1) {
      resetCursors();
      queryClient.invalidateQueries(["students", 1]);
    }
  }, [searchTerm, queryClient, page, resetCursors]);

  // 3. Efecto para mantener caché al volver de detalles
  useEffect(() => {
    const navState = window.history.state?.usr;
    if (navState?.fromList) {
      console.log("🔄 Detectado retorno desde detalles, manteniendo caché");
      queryClient.cancelQueries(["students", page]);
    }
  }, [queryClient, page]);

  // Configuración de queries
  const searchQueryConfig = {
    queryKey: ["studentsSearch", searchTerm],
    queryFn: () => searchStudents(searchTerm),
    enabled: searchTerm.length > 0,
    staleTime: CACHE_STALE_TIME,
    cacheTime: CACHE_TIME,
  };

  const paginationQueryConfig = {
    queryKey: ["students", page, pageAction],
    queryFn: () => {
      console.log(`🔍 Ejecutando consulta para página ${page}, acción: ${pageAction || 'normal'}`);
      
      const isReturningFromDetails = window.history.state?.usr?.fromList;
      const cursorsAreStale = areCursorsProbablyStale();
      
      if (cursorsAreStale) {
        console.log(`⚠️ Cursores posiblemente obsoletos después de ${Math.round((Date.now() - lastActivityTimestamp) / 60000)} minutos de inactividad`);
        
        // Forzar reseteo de cursores si están probablemente obsoletos
        if (pageAction) {
          console.log(`🔄 Forzando reconstrucción completa de la página debido a inactividad`);
          // Pasamos cursores nulos para forzar reconstrucción
          return getStudents(
            page,
            null, // Anular pageAction
            null, // Anular firstVisible
            null, // Anular lastVisible
            setFirstVisible,
            setLastVisible,
            true // Indicador de reconstrucción forzada
          );
        }
      }
      
      // Verificar si estamos retornando de detalles
      if (maxKnownPage > 1 && page > maxKnownPage && pageAction === "next" && !isReturningFromDetails) {
        console.log(`⚠️ Evitando consulta a página inexistente: ${page} > ${maxKnownPage}`);
        return { studentList: [], hasMore: false, redirectToPage: maxKnownPage };
      }
      
      return getStudents(
        page,
        pageAction,
        firstVisible,
        lastVisible,
        setFirstVisible,
        setLastVisible
      );
    },
    enabled: searchTerm.length === 0,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    staleTime: CACHE_STALE_TIME,
    cacheTime: CACHE_TIME,
  };

  // Ejecutar queries
  const searchQuery = useQuery(searchQueryConfig);
  const paginationQuery = useQuery(paginationQueryConfig);
  
  // Determinar query activa y extraer datos
  const activeQuery = searchTerm.length > 0 ? searchQuery : paginationQuery;
  const { data, isLoading, isError, error } = activeQuery;
  
  // Determinar estados específicos
  const isPreviousData = searchTerm.length > 0 ? false : paginationQuery.isPreviousData;
  const hasMore = data?.hasMore || false;

  // 4. Efecto para actualizar maxKnownPage
  useEffect(() => {
    if (data && hasMore === false && page > maxKnownPage) {
      console.log(`📊 Marcando página ${page} como la última página conocida`);
      setMaxKnownPage(page);
    }
  }, [data, hasMore, page, maxKnownPage]);

  // 5. Efecto para corregir navegación a páginas inexistentes
  useEffect(() => {
    const isReturningFromDetails = window.history.state?.usr?.fromList;
    
    if (maxKnownPage > 1 && page > maxKnownPage && !isLoading && !isReturningFromDetails) {
      console.log(`⚠️ Navegación a página ${page} excede el máximo conocido (${maxKnownPage})`);
      console.log(`🔙 Redirigiendo a la última página conocida: ${maxKnownPage}`);
      redirectToPage(maxKnownPage);
    }
  }, [page, maxKnownPage, isLoading, redirectToPage]);

  // 6. Efecto para manejar redirecciones
  useEffect(() => {
    if (data?.redirectToPage !== undefined) {
      redirectToPage(data.redirectToPage);
    }
  }, [data, redirectToPage]);

  // 7. Efecto para guardar información de paginación
  useEffect(() => {
    if (data?.studentList && data.studentList.length > 0 && !searchTerm) {
      try {
        const pagesInfo = JSON.parse(sessionStorage.getItem('pagesInfo') || '{}');
        
        pagesInfo[page] = {
          firstDocId: data.studentList[0].id,
          lastDocId: data.studentList[data.studentList.length - 1].id,
          hasMore
        };
        
        sessionStorage.setItem('pagesInfo', JSON.stringify(pagesInfo));
      } catch (e) {
        console.error("Error guardando información de paginación:", e);
      }
    }
  }, [data, page, hasMore, searchTerm]);

  // 8. Efecto de debugging
  useEffect(() => {
    console.log("Estado actual:", {
      búsqueda: searchTerm,
      página: page,
      acción: pageAction,
      primerRender: isFirstRender,
      firstVisible: firstVisible ? 'definido' : 'undefined',
      lastVisible: lastVisible ? 'definido' : 'undefined',
      hasMore,
      isLoading,
      resultados: data?.studentList?.length || 0
    });
  }, [searchTerm, page, pageAction, hasMore, isLoading, data, firstVisible, lastVisible, isFirstRender]);

  // Efecto para detectar inactividad al cambiar de página
  useEffect(() => {
    if (areCursorsProbablyStale()) {
      console.log(`🔄 Detectada inactividad prolongada al cambiar a página ${page}`);
      console.log(`🧹 Limpiando caché y cursores para forzar recarga`);
      
      setFirstVisible(null);
      setLastVisible(null);
      queryClient.invalidateQueries(["students", page]);
    }
  }, [page, areCursorsProbablyStale, queryClient]);

  // SOLUCIÓN: Crear un estado combinado para isLoading que considere el primer render
  const isLoadingWithMask = isLoading || isFirstRender;

  // Retornar los valores y funciones necesarios, con isLoading mejorado
  return {
    students: data?.studentList || [],
    isLoading: isLoadingWithMask, // Usar el estado combinado 
    isFirstRender,               // Exportar también este flag para posibles usos
    isError,
    error,
    isPreviousData,
    page,
    setPage,
    hasMore,
    setPageAction,
    firstVisible,
    lastVisible,
    setFirstVisible,
    setLastVisible,
    isSearchActive: searchTerm.length > 0
  };
};
