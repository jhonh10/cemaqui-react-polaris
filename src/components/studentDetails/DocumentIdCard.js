import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  LegacyCard,
  LegacyStack,
  Stack,
  Subheading,
  Text,
  TextContainer,
  VerticalStack,
} from "@shopify/polaris";
import * as Yup from "yup";
import { useFormik } from "formik";
import { ModalForm } from "../ModalForm";
import { DocumentIdForm } from "./DocumentIdForm";
import {
  updateStudentData,
  validateIfStudentExist,
} from "../../firebase/client";

export const DocumentIdCard = ({ id, documentId }) => {
  const [openModal, setOpenModal] = useState(false);
  const { handleToast } = useOutletContext();
  const toggleOpenModal = useCallback(
    () => setOpenModal((openModal) => !openModal),
    []
  );
  const initialValues = {
    documentId,
  };

  const registerSchema = Yup.object().shape({
    documentId: Yup.string()
      .matches(/^[0-9]+$/, "Deben ser solo numeros")
      .min(5, "No parece un documento valido")
      .required("numero de cedula es requerido")
      .test(
        "documentId",
        "Ya existe un registro con este numero de cedula",
        async (value) => {
          const response = await validateIfStudentExist({ id: value });
          return !response;
        }
      ),
  });

  const queryClient = useQueryClient();

  const updateDocumentIdMutation = useMutation({
    mutationFn: updateStudentData,
    onSuccess: () => {
      queryClient.invalidateQueries("studentById");
      setOpenModal(false);
      handleToast("Los datos del alumno han sido actualizados");
    },
    onError: (error) => handleToast(error),
  });

  const onSubmit = async () => {
    await updateDocumentIdMutation.mutateAsync({
      docId: id,
      data: { documentId: values.documentId },
    });
  };
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    onSubmit,
  });

  const {
    values,
    errors,
    isSubmitting,
    handleSubmit,
    setFieldValue,
    handleReset,
    dirty,
  } = formik;
  const cancelAction = () => {
    toggleOpenModal();
    handleReset();
  };

  const modalForm = (
    <ModalForm
      open={openModal}
      title="Editar documento"
      cancelAction={cancelAction}
      disabled={!dirty}
      body={
        <DocumentIdForm
          values={values}
          setFieldValue={setFieldValue}
          error={errors.documentId}
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
        title="Numero de cedúla"
        actions={[{ content: "Editar", onAction: toggleOpenModal }]}
      >
        {documentId}
      </LegacyCard.Section>
    </>
  );
};
