import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Card, Layout, PageActions } from '@shopify/polaris';
import ModalConfirm from '../components/ModalConfirm';
import { deleteStudent } from '../firebase/client';
import { NotesCard } from '../components/studentDetails/NotesCard';
import { DocumentIdCard } from '../components/studentDetails/DocumentIdCard';
import { ContactInfoCard } from '../components/studentDetails/ContactInfoCard';
import { AdressInfoCard } from '../components/studentDetails/AdressInfoCard';
import { CoursesCard } from '../components/studentDetails/CoursesCard';
import useTimeAgo from '../hooks/useTimeAgo';

export const StudentDetails = ({ studentData, refetch }) => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { firstname, lastname, courses, documentId, notes, email, createdAt, phone, address, id } =
    studentData;

  // const { dateTime, timeAgo } = useTimeAgo(new Date());
  // console.log(dateTime, timeAgo);

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
          <CoursesCard courses={courses} refetch={refetch} id={id} />
        </Layout.Section>
        <Layout.Section secondary>
          <NotesCard notes={notes} id={id} refetch={refetch} />
          <Card>
            <DocumentIdCard documentId={documentId} refetch={refetch} id={id} />
            <ContactInfoCard email={email} phone={phone} refetch={refetch} id={id} />
            <AdressInfoCard address={address} refetch={refetch} id={id} />
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
