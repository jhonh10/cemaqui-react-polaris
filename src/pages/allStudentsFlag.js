import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Spinner } from "@shopify/polaris";
import { useFetchStudents } from "../hooks/useFetchStudents";
import { useReturningNavigation } from "../hooks/useReturningNavigation";
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
    setLastVisible,
  } = useFetchStudents();

  // Usar el hook unificado
  const { isReturningFromDetails } = useReturningNavigation();

  // Modificar la condición de renderizado del spinner de carga
  // Si se está cargando (incluyendo el primer renderizado), mostrar spinner
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <Spinner size="large" color="teal" />
      </div>
    );
  }

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
      isLoading={isLoading}
      isReturningFromDetails={isReturningFromDetails}
    />
  );
};

export default StudentsContainer;
