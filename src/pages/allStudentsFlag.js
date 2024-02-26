import { useFetchStudents } from "../hooks/useFetchStudents";
import { AllStudents } from "./allStudents";

export default function AllStudentsFlag() {
  const { students, isLoading, isError, error } = useFetchStudents();

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>´se ha producido un error ${error}´</div>;
  if (!students) return <div>No students</div>;
  return <AllStudents students={students.studentList} />;
}
