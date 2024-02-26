import { Page } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import ListTable from "../components/ListTable";

export const AllStudents = ({ students }) => {
  const navigate = useNavigate();
  const handlestudentCreate = () => navigate("new");
  console.log(students);

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
      <ListTable students={students} />
    </Page>
  );
};
