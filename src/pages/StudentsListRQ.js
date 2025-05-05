import React, { useEffect } from "react";
import { useFirestorePaginationRQ } from "../hooks/useFirestorePaginationRQ";

export default function StudentsListRQ() {
  const {
    docs,
    isLoading,
    pageIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    prefetchNextPage,
  } = useFirestorePaginationRQ();

  useEffect(() => {
    prefetchNextPage();
  }, [prefetchNextPage]);

  if (isLoading) {
    return <div>Cargando estudiantes...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Lista de Estudiantes (Página {pageIndex + 1})</h1>

      <ul>
        {docs.map((doc) => (
          <li key={doc.id}>
            {doc.data().firstName} {doc.data().lastName}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={prevPage} disabled={!hasPrevPage}>
          Anterior
        </button>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
