import { useQuery } from "@tanstack/react-query";
import { getStudentById } from "../firebase/client";

export const useFetchStudentById = (studentId) => {
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["studentById", studentId],
    queryFn: () => getStudentById(studentId),
    refetchOnWindowFocus: false,
    cacheTime: 0,
  });

  return { studentData: data, isLoading, isFetching, isError, error };
};
