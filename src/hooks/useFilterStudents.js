import { useState, useEffect, useCallback } from 'react';
import { filter } from 'lodash';
import { useSearchParams } from 'react-router-dom';
import { useFetchStudents } from './useFetchStudents';

export const useFilterStudents = () => {
  const { students, isFetching } = useFetchStudents();
  const [filteredStudents, setFilteredStudents] = useState(students || []);
  const [isFiltering, setIsFiltering] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [queryValue, setQueryValue] = useState(query || '');

  const applySortFilter = (array, query) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    if (query) {
      return filter(
        array,
        (_user) =>
          _user.firstname.toLowerCase().includes(query.toLowerCase()) ||
          _user.lastname.toLowerCase().includes(query.toLowerCase()) ||
          _user.documentId.toString().toLowerCase().includes(query.toLowerCase())
      );
    }
    return stabilizedThis.map((el) => el[0]);
  };

  const addQueryParams = useCallback(() => {
    setSearchParams({ query: queryValue });
  }, [queryValue, setSearchParams]);

  const removeQueryParams = useCallback(() => {
    searchParams.delete('query');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      if (queryValue) {
        setIsFiltering(true);
        addQueryParams();
        setFilteredStudents(applySortFilter(students, queryValue));
      }
      if (!queryValue) {
        removeQueryParams();
        setFilteredStudents(students || []);
      }
    }, 600);
    return () => clearTimeout(timeOutId);
  }, [queryValue, students, addQueryParams, removeQueryParams]);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      setIsFiltering(false);
    }, 600);
    return () => clearTimeout(timeOutId);
  }, [filteredStudents]);

  return { filteredStudents, isFiltering, queryValue, isFetching, setQueryValue };
};
