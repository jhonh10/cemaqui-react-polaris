import { useParams } from 'react-router-dom';
import { useFetchStudentById } from '../hooks/useFetchStudentById';
import { StudentDetails } from './studentDetails';

export default function StudentFlag() {
  const { studentId } = useParams();
  const { studentData, isLoading, refetch } = useFetchStudentById(studentId);
  if (isLoading) return <div>Cargando....</div>;
  if (!studentData) return <div>No hay cliente en esta Dirección</div>;
  return <StudentDetails studentData={studentData} refetch={refetch} />;
}
