import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Page, Layout, PageActions, LegacyCard } from "@shopify/polaris";
import ModalConfirm from "../components/ModalConfirm";
import { deleteStudent, restoreCursorsFromPagesInfo } from "../firebase/client";
import { NotesCard } from "../components/studentDetails/NotesCard";
import { DocumentIdCard } from "../components/studentDetails/DocumentIdCard";
import { ContactInfoCard } from "../components/studentDetails/ContactInfoCard";
import { AdressInfoCard } from "../components/studentDetails/AdressInfoCard";
import { CoursesCard } from "../components/studentDetails/CoursesCard";
import useTimeAgo from "../hooks/useTimeAgo";

export const StudentDetails = ({ studentData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    firstname,
    lastname,
    courses,
    documentId,
    notes,
    email,
    phone,
    address,
    id,
  } = studentData;

  const { state } = location;
  const fromList = state?.fromList;
  const currentPage = state?.currentPage;
  const currentQuery = state?.currentQuery;

  // Verificar si la página actual es la última conocida
  const isLastPage = useMemo(() => {
    try {
      const pagesInfo = JSON.parse(sessionStorage.getItem("pagesInfo") || "{}");
      const pageData = pagesInfo[currentPage];

      // Si esta página no tiene más páginas, es la última
      return pageData && pageData.hasMore === false;
    } catch (e) {
      console.error("Error al verificar si es la última página:", e);
      return false;
    }
  }, [currentPage]);

  const getBackUrl = () => {
    let backUrl = "/admin/students";

    if (!fromList) return backUrl;

    const params = new URLSearchParams();
    
    // Usar un valor por defecto (1) cuando currentPage es undefined
    const pageToReturn = currentPage || 1;

    // Asegurarnos de que currentPage sea un número positivo
    if (pageToReturn > 1) {
      console.log(`🔙 Regresando a la página ${pageToReturn}`);
      params.set("page", pageToReturn.toString());
    }

    if (currentQuery) {
      params.set("query", currentQuery);
    }

    const queryString = params.toString();
    if (queryString) {
      backUrl = `${backUrl}?${queryString}`;
    }

    return backUrl;
  };

  // Modificar handleBack
  const handleBack = () => {
    // Manejar el caso donde currentPage es undefined
    const pageToReturn = currentPage || 1;
    
    const backUrl = getBackUrl();
    console.log(`🔙 Regresando a la página ${pageToReturn}`);

    // ÚNICA llamada para guardar datos de retorno
    sessionStorage.setItem("returning_from_details", "true");
    sessionStorage.setItem("returning_to_page", pageToReturn.toString());
    
    // Asegurarnos de tener todos los cursores necesarios sin duplicar logs
    restoreCursorsFromPagesInfo();

    // Asegúrate de que estos indicadores lleguen a la página de destino
    navigate(backUrl, {
      state: {
        fromList: true,
        currentPage: pageToReturn,
        currentQuery,
        returningFromDetails: true, // Añadir explícitamente
        timestamp: Date.now()
      },
    });
  };

  const deleteStudentMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      navigate("/admin/students");
      setLoading(false);
      setOpenModal(false);
    },
  });

  const handleDelete = async () => {
    setLoading(true);
    await deleteStudentMutation.mutateAsync(id, setLoading);
  };

  const modalPrompt = (
    <ModalConfirm
      open={openModal}
      cancelAction={() => setOpenModal(false)}
      confirmAction={handleDelete}
      title={`¿Eliminar ${firstname} ${lastname}? `}
      bodyText={`¿Confirmas que quieres eliminar el alumno ${firstname} ${lastname}? Esta acción no se puede deshacer.`}
      primaryActionTitle="Eliminar alumno"
      secondaryActionTitle="Cerrar"
      loading={loading}
    />
  );

  return (
    <Page backAction={{ content: "Volver", onAction: handleBack }}>
      {modalPrompt}
      <Layout>
        <Layout.Section>
          <CoursesCard courses={courses} id={id} />
        </Layout.Section>
        <Layout.Section secondary>
          <NotesCard notes={notes} id={id} />
          <LegacyCard>
            <DocumentIdCard documentId={documentId} id={id} />
            <ContactInfoCard email={email} phone={phone} id={id} />
            <AdressInfoCard address={address} id={id} />
          </LegacyCard>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: "Eliminar alumno",
                destructive: true,
                outline: true,
                onAction: () => setOpenModal(true),
              },
            ]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
};
