import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "../firebase/client";

export const useFetchStudents = () => {
  const [page, setPage] = useState(1);
  const [pageAction, setPageAction] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);

  const { data, isLoading, isError, error, isPreviousData } = useQuery({
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
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  // Determinar si hay más páginas
  const hasMore = data?.hasMore || false;

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
    // También necesitamos exportar estas propiedades
    firstVisible,
    lastVisible,
    setFirstVisible,
    setLastVisible
  };
};
