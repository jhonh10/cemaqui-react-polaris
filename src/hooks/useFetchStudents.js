import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getStudents, searchStudents } from "../firebase/client";

export const useFetchStudents = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("query") || "";

  // Para paginación normal
  const [page, setPage] = useState(1);
  const [pageAction, setPageAction] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);

  // Añadir si es una carga inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Modificar el efecto de establecer la página desde la URL:

  // Efecto para establecer la página desde la URL al cargar
  useEffect(() => {
    if (!searchTerm) {
      const pageParam = searchParams.get("page");
      if (pageParam && !Number.isNaN(parseInt(pageParam, 10))) {
        const pageNumber = parseInt(pageParam, 10);
        console.log(`📄 Configurando página inicial a ${pageNumber} desde URL`);
        setPage(pageNumber);
        
        // Al restaurar la página desde la URL, necesitamos reiniciar los cursores
        // Esto forzará la reconstrucción de la página
        if (pageNumber > 1) {
          console.log(`🔄 Reiniciando cursores para reconstruir la página ${pageNumber}`);
          setFirstVisible(null);
          setLastVisible(null);
          // Establecemos pageAction a null para indicar una carga inicial
          setPageAction(null);
        }
      } else {
        // Si no hay parámetro de página, asegurarnos de estar en página 1
        console.log("📄 No hay página en URL, estableciendo página 1");
        setPage(1);
      }
    }
  }, [searchParams, searchTerm, setFirstVisible, setLastVisible, setPage, setPageAction]);

  // Efecto para resetear paginación cuando cambia el término de búsqueda
  useEffect(() => {
    // Si estamos empezando una búsqueda o cambiando de búsqueda a no búsqueda
    if (searchTerm) {
      // Al buscar, invalidar la caché de búsqueda anterior
      queryClient.invalidateQueries(["studentsSearch"]);
    } else if (page === 1) {
      // Al salir del modo búsqueda, volver a cargar con estado limpio si estamos en la página 1
      setFirstVisible(null);
      setLastVisible(null);
      setPageAction(null);
      queryClient.invalidateQueries(["students", 1]);
    }
  }, [searchTerm, queryClient, page]);

  // Query para búsqueda
  const searchQuery = useQuery({
    queryKey: ["studentsSearch", searchTerm],
    queryFn: () => searchStudents(searchTerm),
    enabled: searchTerm.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Query para paginación normal
  const paginationQuery = useQuery({
    queryKey: ["students", page, pageAction],
    queryFn: () =>
      getStudents(
        page,
        pageAction,
        firstVisible,
        lastVisible,
        setFirstVisible,
        setLastVisible
      ),
    enabled: searchTerm.length === 0,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Determinar qué query usar
  const activeQuery = searchTerm.length > 0 ? searchQuery : paginationQuery;

  // Destructuring valores de la query activa
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = activeQuery;

  // Tratamiento especial para isPreviousData
  const isPreviousData = searchTerm.length > 0 ? false : paginationQuery.isPreviousData;

  // Determinar si hay más páginas
  const hasMore = data?.hasMore || false;

  // Efecto para manejar redirecciones
  useEffect(() => {
    // Si la consulta devuelve una redirección a otra página
    if (data?.redirectToPage !== undefined) {
      console.log(`🔀 Redirigiendo a página ${data.redirectToPage}`);
      
      // Limpiar cursores para asegurar una carga limpia
      setFirstVisible(null);
      setLastVisible(null);
      setPageAction(null);
      
      // Actualizar estado de página
      setPage(data.redirectToPage);
      
      // Actualizar URL
      const params = new URLSearchParams(searchParams);
      if (data.redirectToPage === 1) {
        params.delete("page");
      } else {
        params.set("page", data.redirectToPage.toString());
      }
      setSearchParams(params);
    }
  }, [data, setPage, searchParams, setSearchParams, setFirstVisible, setLastVisible, setPageAction]);

  // Justo después de las queries, añadir:
  useEffect(() => {
    // Después del montaje inicial, marcar como no inicial
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Añadir después de que los datos se cargan exitosamente:
  useEffect(() => {
    if (data?.studentList && data.studentList.length > 0 && !searchTerm) {
      try {
        // Guardar los IDs del primer y último documento para cada página
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

  // Para debugging
  useEffect(() => {
    console.log("Estado actual:");
    console.log(`- Búsqueda: "${searchTerm}"`);
    console.log(`- Página: ${page}`);
    console.log(`- Acción: ${pageAction}`);
    console.log(`- firstVisible: ${firstVisible ? 'definido' : 'undefined'}`);
    console.log(`- lastVisible: ${lastVisible ? 'definido' : 'undefined'}`);
    console.log(`- Tiene más: ${hasMore}`);
    console.log(`- Cargando: ${isLoading}`);
    console.log(`- Resultados: ${data?.studentList?.length || 0}`);
  }, [searchTerm, page, pageAction, hasMore, isLoading, data, firstVisible, lastVisible]);

  return {
    students: data?.studentList || [],
    isLoading,
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
