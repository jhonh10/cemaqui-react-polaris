import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "../firebase/client";

export const useFetchStudents = () => {
  const [page, setPage] = useState(1);
  const [pageAction, setPageAction] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);

  console.log(pageAction, lastVisible, firstVisible);
  const { data, isLoading, isError, error, isPreviousData } = useQuery({
    queryKey: ["students", page],
    queryFn: () => getStudents(page, lastVisible, setLastVisible),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
  return {
    data,
    isLoading,
    isError,
    error,
    isPreviousData,
    page,
    setPage,
    setPageAction,
  };
};
