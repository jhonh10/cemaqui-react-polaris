import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const useFilterStudents = ({ students }) => {
  // Obtener query de la URL al iniciar
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  
  // Estados
  const [queryValue, setQueryValue] = useState(initialQuery);
  const [isFiltering, setIsFiltering] = useState(false);

  // Actualizar URL cuando cambia la consulta (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (queryValue) {
        setSearchParams({ query: queryValue });
      } else {
        searchParams.delete("query");
        setSearchParams(searchParams);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [queryValue, searchParams, setSearchParams]);

  // Filtrar estudiantes basado en la consulta (memoizado)
  const filteredStudents = useMemo(() => {
    setIsFiltering(true);
    
    if (!queryValue.trim()) {
      // Si no hay consulta, devolver todos los estudiantes
      setTimeout(() => setIsFiltering(false), 300);
      return students;
    }
    
    const normalizedQuery = queryValue.toLowerCase().trim();
    
    const result = students.filter(student => 
      student.firstname?.toLowerCase().includes(normalizedQuery) ||
      student.lastname?.toLowerCase().includes(normalizedQuery) ||
      student.documentId?.toString().toLowerCase().includes(normalizedQuery)
    );
    
    setTimeout(() => setIsFiltering(false), 300);
    return result;
  }, [queryValue, students]);

  return {
    filteredStudents,
    isFiltering,
    queryValue,
    setQueryValue,
  };
};
