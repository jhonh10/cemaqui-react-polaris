import { useParams } from 'react-router-dom';
import { useFetchStudentById } from '../hooks/useFetchStudentById';
import { StudentDetails } from './studentDetails';

export default function StudentFlag() {
  const { studentId } = useParams();
  const { studentData, isLoading, isError } = useFetchStudentById(studentId);
  if (isLoading) return <div>Cargando....</div>;
  if (!studentData) return <div>No hay cliente en esta Dirección</div>;
  if (isError) return <div>Error</div>;
  return <StudentDetails studentData={studentData} />;
}
