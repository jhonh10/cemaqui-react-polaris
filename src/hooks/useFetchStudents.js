import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../firebase/client';

export const useFetchStudents = () => {
  const { data, isLoading } = useQuery(['students'], getStudents);
  return { students: data, isFetching: isLoading };
};
