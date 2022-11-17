import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '../firebase/client';

export const useFetchStudentById = (studentId) => {
  const { data, isLoading, refetch } = useQuery(
    ['studentById', studentId],
    async () => getStudentById(studentId),
    {
      cacheTime: 0,
      refetchOnWindowFocus: false
    }
  );

  return { studentData: data, isLoading, refetch };
};
