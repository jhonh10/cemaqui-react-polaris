import { Badge, Button, Card, List, Stack, TextStyle } from '@shopify/polaris';
import { useFormik } from 'formik';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Yup from 'yup';
import { formatDate, updateStudentCourses, updateStudentData } from '../../firebase/client';
import ModalConfirm from '../ModalConfirm';
import { ModalForm } from '../ModalForm';
import { AddCourseForm } from './AddCourseForm';

export const CoursesCard = ({ courses, id, refetch }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openModalPropmt, setOpenModalPropmt] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState({
    name: '',
    index: null
  });
  const [loading, setLoading] = useState(false);
  const { handleToast } = useOutletContext();
  const toggleOpenModal = useCallback(() => setOpenModal((openModal) => !openModal), []);

  const initialValues = {
    course: '',
    resolution: ''
  };

  const registerSchema = Yup.object().shape({
    course: Yup.string().required('Seleccione un curso'),
    resolution: Yup.string().required('Seleccione una resolucion')
  });

  const onSubmit = async () => {
    try {
      await updateStudentCourses({
        docId: id,
        data: { name: values.course, date: new Date(), status: 'Vigente' }
      });
      await refetch();
      handleReset();
      setOpenModal(false);
      handleToast('Los datos del alumno han sido actualizados');
    } catch (error) {
      handleToast(error);
    }
  };
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    enableReinitialize: true,
    onSubmit
  });

  const { errors, values, isSubmitting, dirty, handleSubmit, setFieldValue, handleReset } = formik;

  const cancelAction = () => {
    toggleOpenModal();
    handleReset();
  };

  const removeCourse = async (fieldId) => {
    setLoading(true);
    try {
      courses.splice(fieldId, 1);
      await updateStudentData({ docId: id, data: { courses } });
      setLoading(false);
      refetch();
      setOpenModalPropmt(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const handleDelete = (course, index) => {
    setCourseToRemove({ name: course.name, index });
    setOpenModalPropmt(true);
  };

  const modalForm = (
    <ModalForm
      open={openModal}
      title="Editar informacion de contacto"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={<AddCourseForm values={values} setFieldValue={setFieldValue} error={errors} />}
      confirmAction={handleSubmit}
      loading={isSubmitting}
    />
  );

  const modalPrompt = (
    <ModalConfirm
      open={openModalPropmt}
      cancelAction={() => setOpenModalPropmt(false)}
      confirmAction={() => removeCourse(courseToRemove.index)}
      title={`¿Eliminar curso de ${courseToRemove.name}? `}
      bodyText={`¿Confirmas que quieres eliminar el curso de ${courseToRemove.name}? Esta acción no se puede deshacer.`}
      primaryActionTitle="Eliminar curso"
      secondaryActionTitle="Cerrar"
      loading={loading}
    />
  );
  return (
    <>
      {modalPrompt}
      {modalForm}
      <Card
        title="Cursos realizados"
        primaryFooterAction={{ content: 'Agregar curso', onAction: toggleOpenModal }}
      >
        {courses.map((course, index) => {
          const date = formatDate(course.date.toDate(), 'es', { dateStyle: 'long' });
          return (
            <Card.Section subdued key={index}>
              <Stack vertical spacing="tight">
                <Stack spacing="tight" distribution="equalSpacing">
                  <Stack.Item fill>
                    <List.Item>
                      {course.name} <Badge status="success">{course.status}</Badge>
                    </List.Item>
                    <TextStyle variation="subdued">{`El ${date}`}</TextStyle>
                  </Stack.Item>
                  <Button plain destructive onClick={() => handleDelete(course, index)}>
                    Eliminar
                  </Button>
                </Stack>
              </Stack>
            </Card.Section>
          );
        })}
      </Card>
    </>
  );
};
