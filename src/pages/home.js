// Ejemplo de uso
import React from 'react';
import SimplePagination from '../components/SimplePagination';

const StudentsPage = () => {
  return (
    <div>
      <h1>Listado de Estudiantes</h1>
      <SimplePagination collection="Alumnos" pageSize={20} />
    </div>
  );
};

export default StudentsPage;