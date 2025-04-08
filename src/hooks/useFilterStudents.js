import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useFilterStudents = ({ students, setPage }) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [queryValue, setQueryValue] = useState(initialQuery);
  const [isFiltering, setIsFiltering] = useState(false);

  // Efecto para manejar cambios en la consulta
  useEffect(() => {
    setIsFiltering(true);

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const prevQuery = params.get("query") || "";

      // Si cambia el término de búsqueda...
      if (prevQuery !== queryValue) {
        // Aplicar nueva búsqueda o limpiar
        if (queryValue) {
          // Al iniciar una búsqueda...
          params.set("query", queryValue);
          // Guardamos la página actual en la URL pero no la usamos en modo búsqueda
          // Esto nos permitirá restaurarla después
          const currentPage = params.get("page");
          if (currentPage) {
            // Escondemos la página en un parámetro temporal
            params.set("_prevPage", currentPage);
          }
          // Eliminar parámetro de página visible
          params.delete("page");
        } else {
          // Al borrar la búsqueda...
          params.delete("query");

          // Restaurar la página anterior si existe
          const prevPageParam = params.get("_prevPage");
          if (prevPageParam) {
            params.set("page", prevPageParam);
            params.delete("_prevPage");
          }
        }

        // Actualizar URL sin recargar página
        setSearchParams(params);
      }

      // Dar tiempo para la transición visual
      setTimeout(() => setIsFiltering(false), 300);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [queryValue, searchParams, setSearchParams, queryClient, setPage]);

  return {
    filteredStudents: students,
    isFiltering,
    queryValue,
    setQueryValue,
  };
};
