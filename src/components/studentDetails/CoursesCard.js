import { Badge, LegacyCard, List, Text } from '@shopify/polaris';
import { useFormik } from 'formik';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Yup from 'yup';
import { formatDate, updateStudentCourses, updateStudentData } from '../../firebase/client';
import ModalConfirm from '../ModalConfirm';
import { ModalForm } from '../ModalForm';
import { AddCourseForm } from './AddCourseForm';

export const CoursesCard = ({ courses, id }) => {
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

  const queryClient = useQueryClient();

  const updateStudentMutation = useMutation({
    mutationFn: updateStudentCourses,
    onSuccess: () => {
      queryClient.invalidateQueries('studentById');
      setOpenModal(false);
      handleToast('Los datos del alumno han sido actualizados');
      handleReset();
    },
    onError: (error) => handleToast(error)
  });

  const deleteCourseMutation = useMutation({
    mutationFn: updateStudentData,
    onSuccess: () => {
      setLoading(false);
      setOpenModalPropmt(false);
      handleToast('Cursos actualizados correctamente');
    },
    onError: (error) => handleToast(error)
  });

  const onSubmit = async () => {
    await updateStudentMutation.mutateAsync({
      docId: id,
      data: { name: values.course, date: new Date(), status: 'Vigente' }
    });
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
    courses.splice(fieldId, 1);
    await deleteCourseMutation.mutateAsync({
      docId: id,
      data: { courses }
    });
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
      <LegacyCard
        title="Cursos realizados"
        primaryFooterAction={{ content: 'Agregar curso', onAction: toggleOpenModal }}
      >
        {courses.map((course, index) => {
          const date = formatDate(course.date.toDate(), 'es', { dateStyle: 'long' });
          return (
            <LegacyCard.Section
              subdued
              key={index}
              actions={[
                {
                  content: 'Eliminar',
                  destructive: true,
                  onAction: () => handleDelete(course, index)
                }
              ]}
            >
              <List>
                <List.Item>
                  {course.name} <Badge status="success">{course.status}</Badge>
                </List.Item>
                <Text color="subdued" as="span">{`El ${date}`}</Text>
              </List>
            </LegacyCard.Section>
          );
        })}
      </LegacyCard>
    </>
  );
};
