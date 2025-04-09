import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getStudents,
  searchStudents,
  fetchStudentsPage,
  restoreCursorsFromPagesInfo,
  getCursorForPage,
  ensurePageCursors,
} from "../firebase/client";
import { useReturningNavigation } from './useReturningNavigation';

// Constantes
const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

export const useFetchStudents = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("query") || "";

  // Usar el hook unificado
  const { isReturningFromDetails } = useReturningNavigation();

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
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState(
    Date.now()
  );

  // Función para determinar si los cursores son probablemente obsoletos
  const areCursorsProbablyStale = useCallback(() => {
    const inactiveTime = Date.now() - lastActivityTimestamp;
    const MAX_CURSOR_VALIDITY = 5 * 60 * 1000; // 5 minutos
    return inactiveTime > MAX_CURSOR_VALIDITY;
  }, [lastActivityTimestamp]);

  // Añadir esta lógica al inicio del hook

  // Detectar si necesitamos forzar una reconstrucción completa
  const forceRebuild = sessionStorage.getItem("forcePageRebuild") === "true";

  if (forceRebuild) {
    console.log(
      "🔄 Reconstrucción forzada detectada - limpiando estado de paginación"
    );
    resetCursors();
    queryClient.removeQueries(["students"]);
  }

  // Efectos - agregar este al inicio
  useEffect(() => {
    // Solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      // Crear objeto global si no existe
      window._debugHooks = window._debugHooks || {};
      // Exponer estados y funciones del hook
      window._debugHooks.useFetchStudents = {
        setLastActivityTimestamp,
        lastActivityTimestamp,
      };

      // Cleanup
      return () => {
        if (window._debugHooks?.useFetchStudents) {
          window._debugHooks.useFetchStudents = null;
        }
      };
    }
    return undefined;
  }, [lastActivityTimestamp]);

  // Reemplazar el efecto de primer renderizado actual
  useEffect(() => {
    // Verificar inmediatamente si estamos volviendo desde detalles
    const returningFromDetails = sessionStorage.getItem("returning_from_details") === "true";
    
    if (returningFromDetails) {
      // Si estamos volviendo desde detalles, NO es un primer renderizado
      console.log("⏭️ Omitiendo detección de primer renderizado debido a retorno desde detalles");
      setIsFirstRender(false);
    } else {
      // Solo marcar como primer renderizado si genuinamente es la primera carga
      console.log("🔄 Primer renderizado detectado");
      
      // Después de un breve tiempo, desactivar el flag
      const timer = setTimeout(() => {
        setIsFirstRender(false);
        console.log("✅ Finalizando estado de primer renderizado");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Función para actualizar la URL con el número de página
  const updatePageInUrl = useCallback(
    (pageNumber) => {
      const params = new URLSearchParams(searchParams);
      if (pageNumber === 1) {
        params.delete("page");
      } else {
        params.set("page", pageNumber.toString());
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  // Función para inicializar cursores para una carga limpia
  const resetCursors = useCallback(() => {
    // Siempre restaurar desde pagesInfo primero para garantizar coherencia
    restoreCursorsFromPagesInfo();

    // NUNCA llamar a clearAllCursors()

    // Solo resetear variables de estado local
    setFirstVisible(null);
    setLastVisible(null);
    setPageAction(null);

    console.log("🔄 Estado local limpiado, cursores persistentes mantenidos");
  }, []);

  // Función para redirigir a una página específica
  const redirectToPage = useCallback(
    (targetPage) => {
      console.log(`🔀 Redirigiendo a página ${targetPage}`);
      
      // Verificar si tenemos esta página en caché
      const pageInCache = queryClient.getQueryData(["students", targetPage, null]);
      const cursorExists = getCursorForPage(targetPage) !== null;
      
      if (pageInCache && cursorExists) {
        console.log(`📝 Usando datos en caché para redirección a página ${targetPage}`);
        sessionStorage.setItem("using_cached_page", "true");
      } else {
        resetCursors();
      }
      
      setPage(targetPage);
      updatePageInUrl(targetPage);
    },
    [resetCursors, updatePageInUrl, queryClient]
  );

  // Modificar el efecto que inicializa desde URL
  useEffect(() => {
    // Leer parámetros independientemente del estado de initializedFromUrl
    const returningFromDetails = sessionStorage.getItem("returning_from_details") === "true";
    const returningToPage = parseInt(sessionStorage.getItem("returning_to_page") || "1", 10);
    const pageParam = searchParams.get("page");
    
    // Si estamos regresando de detalles, esto tiene prioridad absoluta
    if (returningFromDetails) {
      console.log(`🔙 Detectado retorno desde detalles a página ${returningToPage}`);
      
      // Forzar la página correcta
      setPage(returningToPage); 
      
      // Marcar como inicializado para evitar otros efectos
      setInitializedFromUrl(true);
      setIsFirstRender(false);
      
      // Mantener el valor de "returning_from_details" hasta que la navegación esté completa
      
      // Actualizar URL explícitamente
      const params = new URLSearchParams(searchParams);
      params.set("page", returningToPage.toString());
      setSearchParams(params);
      
      // Marcar uso de caché
      sessionStorage.setItem("using_cached_page", "true");
      
      // Limpiar el indicador después de un momento para permitir que la navegación complete
      setTimeout(() => {
        sessionStorage.removeItem("returning_from_details");
      }, 500);
    }
    // Si no estamos retornando de detalles pero hay un param de página, inicializar desde URL
    else if (!initializedFromUrl && pageParam && !searchTerm) {
      const pageNumber = parseInt(pageParam, 10);
      if (!Number.isNaN(pageNumber) && pageNumber > 0) {
        console.log(`📄 Configurando página inicial a ${pageNumber} desde URL`);
        setPage(pageNumber);
        setInitializedFromUrl(true);
      }
    }
  }, [searchParams, setSearchParams, setPage, searchTerm]);

  // 2. Efecto para manejar cambios en término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      queryClient.invalidateQueries(["studentsSearch"]);
    } else if (page === 1) {
      resetCursors();
      queryClient.invalidateQueries(["students", 1]);
    }
  }, [searchTerm, queryClient, page, resetCursors]);

  // Añadir un nuevo efecto para escuchar el evento appStateRestored

  // Simplificar el manejador de appStateRestored
  useEffect(() => {
    const handleAppStateRestored = () => {
      // SIMPLIFICACIÓN: Ignorar este evento por completo
      console.log(
        "⚠️ Evento appStateRestored ignorado - usando flujo estándar"
      );
    };

    window.addEventListener("appStateRestored", handleAppStateRestored);
    return () =>
      window.removeEventListener("appStateRestored", handleAppStateRestored);
  }, []);

  // Añadir este efecto para reconstrucción secuencial

  // Efecto para manejar reconstrucción secuencial
  useEffect(() => {
    const handleSequentialRebuild = async () => {
      const isSequentialRebuild =
        sessionStorage.getItem("sequentialRebuild") === "true";
      const targetPage = parseInt(
        sessionStorage.getItem("targetRebuildPage") || "1",
        10
      );

      if (isSequentialRebuild && page === 1) {
        console.log(
          `🔄 Iniciando reconstrucción secuencial hasta página ${targetPage}`
        );

        // Limpiar estado antes de empezar
        resetCursors();

        try {
          // Ejecutar secuencialmente para construir todos los cursores intermedios
          await queryClient.fetchQuery(["students", 1, null]);

          // Reconstruir página por página (importante para mantener cursores secuenciales)
          const pagesToRebuild = Array.from({ length: targetPage - 1 }, (_, idx) => idx + 2);
          console.log(`🔄 Reconstruyendo páginas 2 a ${targetPage}`);

          // Procesar en secuencia sin usar bucles con await
          const processSequentially = async (pages) => {
            if (pages.length === 0) return;
            
            const [currentPage, ...remainingPages] = pages;
            console.log(`🔄 Reconstruyendo página ${currentPage} de ${targetPage}`);
            await queryClient.fetchQuery(["students", currentPage, "next"]);
            
            // Llamada recursiva para el resto de páginas
            return processSequentially(remainingPages);
          };

          await processSequentially(pagesToRebuild);

          // Limpiar bandera de reconstrucción
          sessionStorage.removeItem("sequentialRebuild");
          sessionStorage.removeItem("forcePageRebuild");
          sessionStorage.removeItem("targetRebuildPage");

          // Navegar a la página destino
          console.log(
            `✅ Reconstrucción completada. Navegando a página ${targetPage}`
          );
          setTimeout(() => {
            navigate(`?page=${targetPage}`);
          }, 200);
        } catch (error) {
          console.error("Error en reconstrucción secuencial:", error);

          // Limpiar banderas en caso de error
          sessionStorage.removeItem("sequentialRebuild");
          sessionStorage.removeItem("forcePageRebuild");
          sessionStorage.removeItem("targetRebuildPage");
        }
      }
    };

    handleSequentialRebuild();
  }, [page, queryClient, resetCursors, navigate]);

  // 1. Crear un efecto que detecte navegación entre páginas ya visitadas
  useEffect(() => {
    if (!isFirstRender && page > 0) {
      // Comprobar si ya tenemos esta página en caché
      const pageInCache = queryClient.getQueryData(["students", page, pageAction]);
      const cursorExists = getCursorForPage(page) !== null;
      
      if (pageInCache && cursorExists) {
        console.log(`📝 Página ${page} encontrada en caché, evitando nueva petición`);
        
        // Si existe en caché, marcar este efecto
        sessionStorage.setItem("using_cached_page", "true");
      }
    }
  }, [page, pageAction, queryClient, isFirstRender]);

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
      // Verificar si estamos regresando de detalles y obtener la página destino
      const isReturningFromSession = sessionStorage.getItem("returning_from_details") === "true";
      const pageToUse = isReturningFromSession 
        ? parseInt(sessionStorage.getItem("returning_to_page") || String(page), 10)
        : page;
      
      // Siempre consultar la página correcta, no necesariamente page (estado React)
      console.log(`🔍 Configurando consulta para página ${pageToUse}`);
      
      // Resto del código verificando caché...
      const possibleCacheKeys = [
        ["students", pageToUse, null],
        ["students", pageToUse, "next"],
        ["students", pageToUse, "previous"]
      ];
      
      // Buscar caché con la página correcta
      const foundKey = possibleCacheKeys.find(key => queryClient.getQueryData(key));
      const cachedData = foundKey ? queryClient.getQueryData(foundKey) : null;
      
      if (cachedData) {
        console.log(`📝 Usando datos de caché para página ${pageToUse}`);
        sessionStorage.setItem("using_cached_page", "true");
        return Promise.resolve(cachedData);
      }
      
      // Si no hay caché, ejecutar la consulta para la página correcta
      console.log(`🔍 Ejecutando consulta para página ${pageToUse}`);
      return getStudents(
        pageToUse,  // Usar pageToUse, no page
        pageAction,
        firstVisible, 
        lastVisible,
        setFirstVisible,
        setLastVisible
      );
    },
    staleTime: CACHE_STALE_TIME,
    cacheTime: CACHE_TIME,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  };

  // Ejecutar queries
  const searchQuery = useQuery(searchQueryConfig);
  const paginationQuery = useQuery(paginationQueryConfig);

  // Determinar query activa y extraer datos
  const activeQuery = searchTerm.length > 0 ? searchQuery : paginationQuery;
  const { data, isLoading, isError, error } = activeQuery;

  // Determinar estados específicos
  const isPreviousData =
    searchTerm.length > 0 ? false : paginationQuery.isPreviousData;
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

    if (
      maxKnownPage > 1 &&
      page > maxKnownPage &&
      !isLoading &&
      !isReturningFromDetails
    ) {
      console.log(
        `⚠️ Navegación a página ${page} excede el máximo conocido (${maxKnownPage})`
      );
      console.log(
        `🔙 Redirigiendo a la última página conocida: ${maxKnownPage}`
      );
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
        const pagesInfo = JSON.parse(
          sessionStorage.getItem("pagesInfo") || "{}"
        );

        pagesInfo[page] = {
          firstDocId: data.studentList[0].id,
          lastDocId: data.studentList[data.studentList.length - 1].id,
          hasMore,
        };

        sessionStorage.setItem("pagesInfo", JSON.stringify(pagesInfo));
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
      firstVisible: firstVisible ? "definido" : "undefined",
      lastVisible: lastVisible ? "definido" : "undefined",
      hasMore,
      isLoading,
      resultados: data?.studentList?.length || 0,
    });
  }, [
    searchTerm,
    page,
    pageAction,
    hasMore,
    isLoading,
    data,
    firstVisible,
    lastVisible,
    isFirstRender,
  ]);

  // Efecto para detectar inactividad al cambiar de página
  useEffect(() => {
    const usingCachedPage = sessionStorage.getItem("using_cached_page") === "true";
    
    if (areCursorsProbablyStale() && !usingCachedPage) {
      console.log(`🔄 Detectada inactividad prolongada al cambiar a página ${page}`);
      console.log(`🧹 Limpiando caché y cursores para forzar recarga`);

      setFirstVisible(null);
      setLastVisible(null);
      queryClient.invalidateQueries(["students", page]);
    } else if (areCursorsProbablyStale() && usingCachedPage) {
      console.log(`📝 Usando caché a pesar de inactividad prolongada`);
    }
  }, [page, areCursorsProbablyStale, queryClient]);

  // Asegúrate de que estas funciones están definidas
  const fetchFirstPage = async () => {
    // Implementa esta función según tu código existente
    // Por ejemplo:
    await fetchStudentsPage(1, 20, null, null);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Verificar si estamos reconstruyendo
      const isRebuilding =
        sessionStorage.getItem("forcePageRebuild") === "true";

      // Si estamos reconstruyendo y estamos en página 1, usamos una estrategia especial
      if (isRebuilding && page === 1) {
        console.log(
          "🔄 Ejecutando estrategia de reconstrucción especial desde página 1"
        );

        try {
          // 1. Limpiar cualquier cursor existente
          resetCursors();

          // 2. Cargar página 1 como base
          const pageOneData = await fetchFirstPage();

          // 3. Guardar cursores específicamente para página 1
          sessionStorage.setItem("cursor_page_1", "definido");

          // 4. Si hay una página destino > 1, precargar hasta esa página
          const targetPage = parseInt(
            sessionStorage.getItem("targetRebuildPage") || "1",
            10
          );

          if (targetPage > 1) {
            console.log(
              `🔄 Precargando datos hasta página ${targetPage} para navegación posterior`
            );

            // Precargar secuencialmente cada página hasta la destino (evitando ++ y await en bucle)
            const pagesToLoad = Array.from(
              { length: targetPage - 1 },
              (_, i) => i + 2
            );

            // Versión secuencial pero sin await en bucle
            for (let i = 0; i < pagesToLoad.length; i += 1) {
              const pageNum = pagesToLoad[i];
              console.log(`🔄 Precargando página ${pageNum}`);
              // eslint-disable-next-line no-await-in-loop
              await queryClient.prefetchQuery(["students", pageNum, "next"]);
              sessionStorage.setItem(`cursor_page_${pageNum}`, "definido");
            }
          }

          return pageOneData;
        } catch (error) {
          console.error("Error durante la reconstrucción:", error);
          // Continuar con el flujo normal si hay error
        }
      }

      return undefined;
    };

    fetchData();
  }, [page, searchTerm, pageAction, queryClient, resetCursors]); // Usar variables definidas

  // SOLUCIÓN: Crear un estado combinado para isLoading que considere el primer render
  const isLoadingWithMask = isLoading || isFirstRender;

  // Retornar los valores y funciones necesarios, con isLoading mejorado
  return {
    students: data?.studentList || [],
    isLoading: isLoadingWithMask, // Usar el estado combinado
    isFirstRender, // Exportar también este flag para posibles usos
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
    isSearchActive: searchTerm.length > 0,
  };
};
