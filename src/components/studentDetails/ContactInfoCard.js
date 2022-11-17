import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Button, Card, Subheading, TextContainer, Stack, Text, TextStyle } from '@shopify/polaris';
import { ModalForm } from '../ModalForm';
import { updateStudentData } from '../../firebase/client';
import { ContactInfoForm } from './ContacInfoForm';

export const ContactInfoCard = ({ email, phone, id, refetch }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(() => setOpenModal((openModal) => !openModal), []);
  const { handleToast } = useOutletContext();

  const studentEmail = email ? (
    <Text>{email}</Text>
  ) : (
    <TextStyle variation="subdued">No se ingreso un correo electronico</TextStyle>
  );

  const studentPhone = phone ? (
    <Text>{`+57 ${phone}`}</Text>
  ) : (
    <TextStyle variation="subdued">No se ingreso un numero de telefono</TextStyle>
  );

  const initialValues = {
    phone,
    email
  };

  const registerSchema = Yup.object().shape({
    phone: Yup.string()
      .matches(/^[0-9]+$/, 'Ingrese un numero de telefono valido')
      .min(10, 'No parece un numero valido'),
    email: Yup.string().email('No parece un email valido')
  });

  const onSubmit = async () => {
    try {
      await updateStudentData({ docId: id, data: { email: values.email, phone: values.phone } });
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
    enableReinitialize: true,
    onSubmit
  });

  const { errors, values, isSubmitting, dirty, handleSubmit, setFieldValue, handleReset } = formik;

  const cancelAction = () => {
    toggleOpenModal();
    handleReset();
  };

  const modalForm = (
    <ModalForm
      open={openModal}
      title="Editar informacion de contacto"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={<ContactInfoForm values={values} setFieldValue={setFieldValue} error={errors} />}
      confirmAction={handleSubmit}
      loading={isSubmitting}
    />
  );

  return (
    <>
      {modalForm}
      <Card.Section>
        <Stack vertical>
          <Stack>
            <Stack.Item fill>
              <Subheading>Informacion de contácto</Subheading>
            </Stack.Item>
            <Button plain onClick={toggleOpenModal}>
              Editar
            </Button>
          </Stack>
          <Stack vertical>
            <TextContainer spacing="tight">
              <Stack vertical>
                <Stack vertical spacing="tight">
                  {studentEmail}
                  {studentPhone}
                </Stack>
              </Stack>
            </TextContainer>
          </Stack>
        </Stack>
      </Card.Section>
    </>
  );
};
