import { useFetchStudents } from "../hooks/useFetchStudents";
import { AllStudents } from "./allStudents";

const StudentsContainer = () => {
  const {
    students,
    isLoading,
    isError,
    page,
    setPage,
    hasMore,
    isPreviousData,
    setPageAction,
    firstVisible,
    lastVisible,
    setFirstVisible,
    setLastVisible
  } = useFetchStudents();

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar los estudiantes</div>;

  return (
    <AllStudents
      students={students}
      setPage={setPage}
      page={page}
      hasMore={hasMore}
      isPreviousData={isPreviousData}
      setPageAction={setPageAction}
      firstVisible={firstVisible}
      lastVisible={lastVisible}
      setFirstVisible={setFirstVisible}
      setLastVisible={setLastVisible}
    />
  );
};

export default StudentsContainer;
