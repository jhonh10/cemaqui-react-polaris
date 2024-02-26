import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../firebase/client';

export const useFetchStudents = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    refetchOnWindowFocus: false
  });
  return { students: data, isLoading, isError, error };
};
