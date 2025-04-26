import React from "react";
import { useFirestorePagination } from "../hooks/useFirestorePagination";

export default function SimplePagination() {
  const {
    docs,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    pageIndex, // <- este es el nombre correcto
  } = useFirestorePagination();

  return (
    <div>
      <h2>Posts (Página {pageIndex + 1})</h2>
      {loading && <p>Cargando...</p>}
      <ul>
        {docs.map((doc) => (
          <li key={doc.id}>{doc.data().firstname}</li>
        ))}
      </ul>
      <button onClick={prevPage} disabled={!hasPrevPage || loading}>
        Anterior
      </button>
      <button onClick={nextPage} disabled={!hasNextPage || loading}>
        Siguiente
      </button>
    </div>
  );
}
