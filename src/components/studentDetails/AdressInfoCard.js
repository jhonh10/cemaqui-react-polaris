import { Button, Card, Stack, Subheading, Text, TextContainer, TextStyle } from '@shopify/polaris';
import React, { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { AddressInfoForm } from './AddressInfoForm';
import { updateStudentData } from '../../firebase/client';
import { ModalForm } from '../ModalForm';

export const AdressInfoCard = ({ address, id, refetch }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(() => setOpenModal((openModal) => !openModal), []);
  const { handleToast } = useOutletContext();

  const studentAddress = address ? (
    <Text>{address}</Text>
  ) : (
    <TextStyle variation="subdued">No se ingreso una dirección</TextStyle>
  );

  const initialValues = {
    address
  };

  const registerSchema = Yup.object().shape({
    address: Yup.string()
  });

  const onSubmit = async () => {
    try {
      await updateStudentData({ docId: id, data: { address: values.address } });
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
      title="Editar dirección"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={<AddressInfoForm values={values} setFieldValue={setFieldValue} error={errors} />}
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
              <Subheading>Dirección predeterminada</Subheading>
            </Stack.Item>
            <Button plain onClick={toggleOpenModal}>
              Gestionar
            </Button>
          </Stack>
          <Stack vertical>
            <TextContainer spacing="tight">
              <Stack vertical>
                <Stack vertical spacing="tight">
                  {studentAddress}
                  <Text>Bogota, Colombia</Text>
                </Stack>
              </Stack>
            </TextContainer>
          </Stack>
        </Stack>
      </Card.Section>
    </>
  );
};
