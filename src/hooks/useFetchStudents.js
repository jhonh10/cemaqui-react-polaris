import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getStudents } from '../firebase/client';

export const useFetchStudents = () => {
  // const { isLoading, data } = useQuery(['students'], getStudents);
  const [students, setStudents] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  useEffect(() => {
    getStudents()
      .then((res) => {
        setStudents(res);
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);
  return { students, isFetching };
};
