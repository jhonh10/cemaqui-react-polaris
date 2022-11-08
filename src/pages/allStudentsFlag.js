import { useFetchStudents } from '../hooks/useFetchStudents';
import { AllStudents } from './allStudents';

export default function AllStudentsFlag() {
  const { students, isLoading } = useFetchStudents();

  if (isLoading) return <div>Cargando...</div>;
  if (!students) return <div>No students</div>;
  return <AllStudents students={students} />;
}
