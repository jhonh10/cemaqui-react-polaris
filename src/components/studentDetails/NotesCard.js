import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { LegacyCard, Text } from '@shopify/polaris';
import { ModalForm } from '../ModalForm';
import { NotesForm } from './NotesForm';
import { updateStudentData } from '../../firebase/client';

export const NotesCard = ({ notes, id }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(() => setOpenModal((openModal) => !openModal), []);
  const { handleToast } = useOutletContext();

  const studentNotes = notes ? (
    <Text truncate as="span">
      {notes}
    </Text>
  ) : (
    <Text color="subdued" as="span">
      No hay notas sobre este alumno
    </Text>
  );

  const initialValues = {
    notes
  };

  const registerSchema = Yup.object().shape({
    notes: Yup.string()
  });

  const queryClient = useQueryClient();

  const updateNotesMutation = useMutation({
    mutationFn: updateStudentData,
    onSuccess: () => {
      queryClient.invalidateQueries('studentById');
      setOpenModal(false);
      handleToast('Los datos del alumno han sido actualizados');
    },
    onError: (error) => {
      setOpenModal(false);
      handleToast(error);
    }
  });

  const onSubmit = async () => {
    await updateNotesMutation.mutateAsync({
      docId: id,
      data: { notes: values.notes }
    });
  };
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    enableReinitialize: true,
    onSubmit
  });

  const { values, isSubmitting, dirty, handleSubmit, setFieldValue, handleReset } = formik;

  const cancelAction = () => {
    toggleOpenModal();
    handleReset();
  };

  const modalForm = (
    <ModalForm
      open={openModal}
      title="Editar notas"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={<NotesForm values={values} setFieldValue={setFieldValue} />}
      confirmAction={handleSubmit}
      loading={isSubmitting}
    />
  );

  return (
    <>
      {modalForm}
      <LegacyCard title="Notas" actions={[{ content: 'Editar', onAction: toggleOpenModal }]}>
        <LegacyCard.Section>{studentNotes}</LegacyCard.Section>
      </LegacyCard>
    </>
  );
};
