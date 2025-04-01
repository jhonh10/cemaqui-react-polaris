import { useState } from "react";
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

  const getBackUrl = () => {
    let backUrl = "/admin/students";

    if (!fromList) return backUrl;

    const params = new URLSearchParams();

    if (currentPage > 1) {
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
      backAction={{ content: "Alumnos", url: backUrl }}
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
