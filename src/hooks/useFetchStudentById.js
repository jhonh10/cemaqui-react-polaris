import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '../firebase/client';

export const useFetchStudentById = (studentById) => {
  const { data, isLoading, refetch } = useQuery(
    ['studentById', studentById],
    () => getStudentById(studentById),
    {
      cacheTime: 0,
      refetchOnWindowFocus: false
    }
  );

  return { studentData: data, isLoading, refetch };
};
