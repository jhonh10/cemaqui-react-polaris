import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Text, LegacyCard, LegacyStack, VerticalStack } from "@shopify/polaris";
import { ModalForm } from "../ModalForm";
import { updateStudentData } from "../../firebase/client";
import { ContactInfoForm } from "./ContacInfoForm";

export const ContactInfoCard = ({ email, phone, id }) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleOpenModal = useCallback(
    () => setOpenModal((openModal) => !openModal),
    []
  );
  const { handleToast } = useOutletContext();

  const studentEmail = email ? (
    <Text as="span">{email}</Text>
  ) : (
    <Text color="subdued" as="span">
      No se ingreso un correo electronico
    </Text>
  );

  const studentPhone = phone ? (
    <Text as="span">{`+57 ${phone}`}</Text>
  ) : (
    <Text color="subdued" as="span">
      No se ingreso un numero de telefono
    </Text>
  );

  const initialValues = {
    phone,
    email,
  };

  const registerSchema = Yup.object().shape({
    phone: Yup.string()
      .matches(/^[0-9]+$/, "Ingrese un numero de telefono valido")
      .min(10, "No parece un numero valido"),
    email: Yup.string().email("No parece un email valido"),
  });
  const queryClient = useQueryClient();

  const updateContactInfoMutation = useMutation({
    mutationFn: updateStudentData,
    onSuccess: () => {
      queryClient.invalidateQueries("studentById");
      setOpenModal(false);
      handleToast("Los datos del alumno han sido actualizados");
    },
  });

  const onSubmit = async () => {
    await updateContactInfoMutation.mutateAsync({
      docId: id,
      data: { email: values.email, phone: values.phone },
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
      title="Editar informacion de contacto"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={
        <ContactInfoForm
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
        title="Información de contácto"
        actions={[{ content: "Editar", onAction: toggleOpenModal }]}
      >
        <VerticalStack>
          <LegacyStack vertical>
            {studentEmail}
            {studentPhone}
          </LegacyStack>
        </VerticalStack>
      </LegacyCard.Section>
    </>
  );
};
