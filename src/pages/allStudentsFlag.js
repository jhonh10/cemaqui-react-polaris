import { useFetchStudents } from "../hooks/useFetchStudents";
import { AllStudents } from "./allStudents";

export default function AllStudentsFlag() {
  const {
    data,
    isLoading,
    isError,
    error,
    isPreviousData,
    page,
    setPage,
    setPageAction,
  } = useFetchStudents();
  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>´se ha producido un error ${error}´</div>;
  if (!data.studentList) return <div>No students</div>;
  console.log(data.studentList);
  return (
    <AllStudents
      students={data?.studentList}
      setPage={setPage}
      page={page}
      hasMore={data?.hasMore}
      setPageAction={setPageAction}
    />
  );
}
