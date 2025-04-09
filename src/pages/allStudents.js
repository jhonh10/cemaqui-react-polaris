import { Page } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ListTable from "../components/ListTable";

export const AllStudents = ({
  students,
  setPage,
  page,
  isPreviousData,
  hasMore,
  setPageAction,
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible,
  isLoading,
  isReturningFromDetails,
}) => {
  const navigate = useNavigate();
  
  const handlestudentCreate = () => navigate("new");
  
  return (
    <Page
      title="Alumnos"
      fullWidth
      primaryAction={{
        content: "Agregar Alumno",
        onAction: handlestudentCreate,
      }}
      secondaryActions={[
        {
          content: "Importar",
          disabled: false,
          helpText: "You need permission to import products.",
        },
      ]}
    >
      <ListTable
        students={students}
        setPage={setPage}
        page={page}
        hasMore={hasMore}
        setPageAction={setPageAction}
        isPreviousData={isPreviousData}
        firstVisible={firstVisible}
        lastVisible={lastVisible}
        setFirstVisible={setFirstVisible}
        setLastVisible={setLastVisible}
        isReturningFromDetails={isReturningFromDetails}
        isLoading={isLoading} // Pasar isLoading desde useFetchStudents
      />
    </Page>
  );
};
