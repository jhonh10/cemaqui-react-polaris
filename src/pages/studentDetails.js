import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Card, Layout, PageActions } from '@shopify/polaris';

import ModalConfirm from '../components/ModalConfirm';
import { deleteStudent } from '../firebase/client';
import { Notes } from '../components/studentDetails/Notes';
import { DocumentIdCard } from '../components/studentDetails/DocumentIdCard';
import { ContactInfoCard } from '../components/studentDetails/ContactInfoCard';
import { AdressInfoCard } from '../components/studentDetails/AdressInfoCard';
import { CoursesCard } from '../components/studentDetails/CoursesCard';

export const StudentDetails = ({ studentData, refetch }) => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { firstname, lastname, course, documentId, notes, email, createdAt, phone, adress, id } =
    studentData;

  const handleDelete = async () => {
    await deleteStudent(id, setLoading);
    navigate('/admin/students');
    setOpenModal(false);
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

  console.log(studentData);
  return (
    <Page
      breadcrumbs={[{ content: 'Alumnos', url: '/admin/students' }]}
      title={`${firstname} ${lastname}`}
      pagination={{
        hasPrevious: true,
        hasNext: true
      }}
      subtitle="Alumno desde hace mas de 1 año"
    >
      {modalPrompt}
      <Layout>
        <Layout.Section>
          <CoursesCard course={course} createdAt={createdAt} />
        </Layout.Section>
        <Layout.Section secondary>
          <Notes notes={notes} id={id} refetch={refetch} />
          <Card>
            <DocumentIdCard documentId={documentId} />
            <ContactInfoCard email={email} phone={phone} />
            <AdressInfoCard adress={adress} />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: 'Eliminar alumno',
                destructive: true,
                outline: true,
                onAction: () => setOpenModal(true)
              }
            ]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
};
