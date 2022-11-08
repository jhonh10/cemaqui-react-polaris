import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Button, Card, Heading, Stack, Text, TextStyle } from '@shopify/polaris';
import { ModalForm } from '../ModalForm';
import { NotesForm } from './NotesForm';
import { updateStudentData } from '../../firebase/client';

export const Notes = ({ notes, id, refetch }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(() => setOpenModal((openModal) => !openModal), []);
  const { handleToast } = useOutletContext();

  const studentNotes = notes ? (
    <Text>{notes}</Text>
  ) : (
    <TextStyle variation="subdued">No hay notas sobre este alumno</TextStyle>
  );

  const initialValues = {
    notes
  };

  const registerSchema = Yup.object().shape({
    notes: Yup.string().max(50)
  });

  const onSubmit = async () => {
    try {
      await updateStudentData(id, values.notes);
      await refetch();
      setOpenModal(false);
      handleToast('Los datos del alumno han sido actualizados');
    } catch (error) {
      handleToast(error);
    }
  };
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit
  });

  const { values, isSubmitting, handleSubmit, setFieldValue, handleReset } = formik;

  const cancelAction = () => {
    toggleOpenModal();
    handleReset();
  };

  const modalForm = (
    <ModalForm
      open={openModal}
      title="Editar notas"
      cancelAction={cancelAction}
      body={<NotesForm values={values} setFieldValue={setFieldValue} />}
      confirmAction={handleSubmit}
      loading={isSubmitting}
    />
  );

  return (
    <>
      {modalForm}
      <Card sectioned>
        <Stack vertical>
          <Stack>
            <Stack.Item fill>
              <Heading>Notas</Heading>
            </Stack.Item>
            <Button plain onClick={toggleOpenModal}>
              Editar
            </Button>
          </Stack>
          {studentNotes}
        </Stack>
      </Card>
    </>
  );
};
