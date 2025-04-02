import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Page, Layout, PageActions, LegacyCard } from "@shopify/polaris";
import ModalConfirm from "../components/ModalConfirm";
import { deleteStudent } from "../firebase/client";
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
      const pagesInfo = JSON.parse(sessionStorage.getItem('pagesInfo') || '{}');
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

    // Asegurarnos de que currentPage sea un número positivo
    if (currentPage && currentPage > 1) {
      console.log(`🔙 Regresando a la página ${currentPage}`);
      params.set("page", currentPage.toString());
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

  const handleBack = () => {
    const backUrl = getBackUrl();
    console.log(`🔙 Volviendo a: ${backUrl}, página: ${currentPage || 1}`);
    
    // Determinar la acción de paginación correcta para cuando volvamos
    // Si estamos en la última página y volvemos a una página anterior,
    // debemos usar pageAction="previous" en lugar de null
    const pageAction = isLastPage && currentPage > 1 ? "previous" : null;
    
    navigate(backUrl, {
      state: {
        fromList: true,
        currentPage: currentPage || 1,
        pageAction,
        timestamp: Date.now()
      }
    });
  };

  const backUrl = getBackUrl();

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
    <Page
      backAction={{
        content: "Volver",
        onAction: () =>
          navigate(getBackUrl(), {
            state: {
              fromList: true,
              returnToPage: currentPage,
            },
          }),
      }}
      title={`${firstname} ${lastname}`}
      pagination={{
        hasPrevious: true,
        hasNext: true,
      }}
      subtitle="Alumno desde hace mas de 1 año"
    >
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
