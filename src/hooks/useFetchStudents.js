import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../firebase/client';

export const useFetchStudents = () => {
  const { data, isLoading } = useQuery(['student'], getStudents, {
    cacheTime: Infinity,
    refetchOnWindowFocus: false
  });
  return { students: data, isLoading };
};
