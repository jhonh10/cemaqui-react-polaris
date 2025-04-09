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
  
  // CAMBIO IMPORTANTE: Inicializar la página usando el valor de URL o sessionStorage
  const initialPage = (() => {
    // Si estamos volviendo de detalles, usar ese valor prioritariamente
    if (sessionStorage.getItem("returning_from_details") === "true") {
      const returningPage = parseInt(sessionStorage.getItem("returning_to_page") || "1", 10);
      return returningPage;
    }
    
    // Si hay un parámetro page en la URL, usarlo
    const urlPage = searchParams.get("page");
    if (urlPage && !Number.isNaN(parseInt(urlPage, 10))) {
      return parseInt(urlPage, 10);
    }
    
    // Valor por defecto
    return 1;
  })();
  
  // Inicializar con la página correcta desde el principio
  const [page, setPage] = useState(initialPage);
  
  // Si estamos volviendo desde detalles, establecer isFirstRender a false inmediatamente
  const [isFirstRender, setIsFirstRender] = useState(
    sessionStorage.getItem("returning_from_details") !== "true"
  );

  const [pageAction, setPageAction] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [maxKnownPage, setMaxKnownPage] = useState(1);

  // Estados para control de carga
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

  // Reemplazar el efecto de primer renderizado actual con esta implementación:
  useEffect(() => {
    // Verificar inmediatamente si estamos volviendo desde detalles
    const returningFromDetails = sessionStorage.getItem("returning_from_details") === "true";
    
    if (returningFromDetails) {
      // Si estamos volviendo desde detalles, NO es un primer renderizado
      console.log("⏭️ Omitiendo detección de primer renderizado debido a retorno desde detalles");
      setIsFirstRender(false);
    } else if (isFirstRender) { // Solo ejecutar esta parte si isFirstRender es true
      // Solo marcar como primer renderizado si genuinamente es la primera carga
      console.log("🔄 Primer renderizado detectado");
      
      // Después de un breve tiempo, desactivar el flag
      const timer = setTimeout(() => {
        setIsFirstRender(false);
        console.log("✅ Finalizando estado de primer renderizado");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFirstRender]); // Añadir isFirstRender como dependencia para que el efecto se ejecute solo cuando cambie

  // Agregar este efecto para detectar cuando volvemos desde detalles con página indefinida
  useEffect(() => {
    // Verificar si necesitamos refrescar la página 1
    const shouldRefreshPageOne = sessionStorage.getItem("refresh_page_one") === "true";
    
    if (shouldRefreshPageOne && page === 1) {
      console.log("🔄 Refrescando datos de página 1 después de volver desde detalles");
      
      // Invalidar la caché para página 1
      queryClient.invalidateQueries(["students", 1, null]);
      
      // Limpiar el indicador para no repetir la operación
      sessionStorage.removeItem("refresh_page_one");
    }
  }, [page, queryClient]);

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

  // Modificar el useEffect que gestiona la inicialización desde URL
  useEffect(() => {
    // Prioridad absoluta: Detectar retorno desde detalles
    const returningFromDetails = sessionStorage.getItem("returning_from_details") === "true";
    
    if (returningFromDetails) {
      const returningToPage = parseInt(sessionStorage.getItem("returning_to_page") || "1", 10);
      console.log(`🔙 Detectado retorno desde detalles a página ${returningToPage}`);
      
      // Establecer página inmediatamente (sin setTimeout)
      setPage(returningToPage);
      setInitializedFromUrl(true);
      setIsFirstRender(false);
      
      // IMPORTANTE: Forzar el uso de caché
      sessionStorage.setItem("using_cached_page", "true");
      
      // CLAVE: Marcar en sessionStorage qué página estamos cargando para la consulta inicial
      sessionStorage.setItem("force_page", returningToPage.toString());
      
      // Limpiar el indicador después de un momento
      setTimeout(() => {
        sessionStorage.removeItem("returning_from_details");
        sessionStorage.removeItem("force_page");
      }, 500);
      
      // Actualizar URL para mantener coherencia
      const params = new URLSearchParams(searchParams);
      params.set("page", returningToPage.toString());
      setSearchParams(params);
      
      return; // Importante: salir temprano para no ejecutar el resto
    }
    
    // Resto de la lógica para inicialización desde URL...
    if (!initializedFromUrl && !searchTerm) {
      const pageParam = searchParams.get("page");
      if (pageParam && !Number.isNaN(parseInt(pageParam, 10))) {
        const pageNumber = parseInt(pageParam, 10);
        if (pageNumber > 0) {
          console.log(`📄 Configurando página inicial a ${pageNumber} desde URL`);
          setPage(pageNumber);
          setInitializedFromUrl(true);
        }
      }
    }
  }, [searchParams, setSearchParams, searchTerm, initializedFromUrl, setPage]);

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
      // Verificar retorno desde detalles y obtener página destino
      const isReturningFromSession = sessionStorage.getItem("returning_from_details") === "true";
      const forcePage = sessionStorage.getItem("force_page");
      const pageFromReturn = parseInt(sessionStorage.getItem("returning_to_page") || "1", 10);
      const shouldRefreshPageOne = sessionStorage.getItem("refresh_page_one") === "true";
      
      // La página a usar será la primera que exista en este orden:
      // 1. force_page (si existe)
      // 2. returning_to_page (si estamos retornando desde detalles)
      // 3. page (estado actual)
      let pageToUse = page;
      
      if (forcePage) {
        pageToUse = parseInt(forcePage, 10);
      } else if (isReturningFromSession) {
        pageToUse = pageFromReturn;
      }
      
      console.log(`🔍 Configurando consulta para página ${pageToUse}`);
      
      // Buscar en las posibles claves de caché
      let cachedData = null;
      
      // Solo usar caché si no estamos forzando refresh para página 1
      if (!(pageToUse === 1 && shouldRefreshPageOne)) {
        const possibleCacheKeys = [
          ["students", pageToUse, null],
          ["students", pageToUse, "next"],
          ["students", pageToUse, "previous"]
        ];
        
        for (let i = 0; i < possibleCacheKeys.length; i += 1) {
          const key = possibleCacheKeys[i];
          const data = queryClient.getQueryData(key);
          if (data) {
            cachedData = data;
            break;
          }
        }
      }
      
      // Si hay caché y no estamos forzando refresh, usarla
      if (cachedData && !(pageToUse === 1 && shouldRefreshPageOne)) {
        console.log(`📝 Usando datos de caché para página ${pageToUse}`);
        
        // Si estamos en una página incorrecta, forzar la correcta
        if (page !== pageToUse) {
          console.log(`⚡ Corrigiendo página a ${pageToUse} desde ${page}`);
          setTimeout(() => setPage(pageToUse), 0);
        }
        
        return Promise.resolve(cachedData);
      }
      
      // Verificar si necesitamos forzar una actualización de la página 1
      const forceRefreshPageOne = sessionStorage.getItem("force_refresh_page_one") === "true";
      
      // Si estamos en página 1 y hay que forzar actualización, siempre ir al servidor
      if (pageToUse === 1 && forceRefreshPageOne) {
        console.log("🔄 Forzando consulta al servidor para página 1 (sin usar caché)");
        sessionStorage.removeItem("force_refresh_page_one");
        
        // Ejecutar consulta fresca y guardar en caché
        return getStudents(
          pageToUse,
          pageAction,
          null, // forzar firstVisible a null
          null, // forzar lastVisible a null
          setFirstVisible,
          setLastVisible,
          true // forzar reconstrucción
        );
      }
      
      // Si estamos forzando refresh o no hay caché, obtener datos frescos
      if (pageToUse === 1 && shouldRefreshPageOne) {
        console.log("🔄 Forzando petición fresca para página 1");
        sessionStorage.removeItem("refresh_page_one"); // Limpiar la bandera
      }
      
      // Si no hay caché o estamos forzando refresh, ejecutar consulta normal
      return getStudents(
        pageToUse,
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
