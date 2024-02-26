import { LegacyCard, LegacyStack, Text, VerticalStack } from "@shopify/polaris";
import React, { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { useFormik } from "formik";
import { AddressInfoForm } from "./AddressInfoForm";
import { updateStudentData } from "../../firebase/client";
import { ModalForm } from "../ModalForm";

export const AdressInfoCard = ({ address, id }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(
    () => setOpenModal((openModal) => !openModal),
    []
  );
  const { handleToast } = useOutletContext();

  const studentAddress = address ? (
    <Text as="span">{address}</Text>
  ) : (
    <Text color="subdued" as="span">
      No se ingreso una dirección
    </Text>
  );

  const initialValues = {
    address,
  };

  const registerSchema = Yup.object().shape({
    address: Yup.string(),
  });
  const queryClient = useQueryClient();
  const updateAddresMutation = useMutation({
    mutationFn: updateStudentData,
    onSuccess: () => {
      queryClient.invalidateQueries("studentById");
      setOpenModal(false);
      handleToast("Los datos del alumno han sido actualizados");
    },
    onError: (error) => handleToast(error),
  });

  const onSubmit = async () => {
    await updateAddresMutation.mutateAsync({
      docId: id,
      data: { address: values.address },
    });
  };
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    enableReinitialize: true,
    onSubmit,
  });

  const {
    errors,
    values,
    isSubmitting,
    dirty,
    handleSubmit,
    setFieldValue,
    handleReset,
  } = formik;

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
      body={
        <AddressInfoForm
          values={values}
          setFieldValue={setFieldValue}
          error={errors}
        />
      }
      confirmAction={handleSubmit}
      loading={isSubmitting}
    />
  );
  return (
    <>
      {modalForm}
      <LegacyCard.Section
        title="Direccion Predeterminada"
        actions={[{ content: "Gestionar", onAction: toggleOpenModal }]}
      >
        <VerticalStack>
          <LegacyStack vertical>{studentAddress}</LegacyStack>
        </VerticalStack>
      </LegacyCard.Section>
    </>
  );
};
