import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import * as Yup from 'yup';
import { Form, FormikProvider, useFormik } from 'formik';
import {
  Page,
  Card,
  Layout,
  FormLayout,
  TextField,
  ContextualSaveBar,
  Banner,
  List,
  Select
} from '@shopify/polaris';
import ModalConfirm from '../components/ModalConfirm';
import { useCallbackPrompt } from '../hooks/useCallBackPropmt';
import { addStudent } from '../firebase/client';
import { courses, resolutions } from '../json/coursesData';

export default function NewStudent() {
  const [isDirty, setIsDirty] = useState(true);
  const [showPrompt, confirmNavigation, cancelNavigation] = useCallbackPrompt(isDirty);
  const { handleToast } = useOutletContext();
  const navigate = useNavigate();

  const initialValues = {
    firstname: '',
    lastname: '',
    documentId: '',
    course: '',
    resolution: '',
    company: '',
    address: '',
    phone: '',
    email: ''
  };

  const registerSchema = Yup.object().shape({
    firstname: Yup.string()
      .min(2, 'Muy Corto!')
      .max(50, 'Muy Largo!')
      .required('Nombre es requerido'),
    lastname: Yup.string()
      .min(2, 'Muy Corto!')
      .max(50, 'Muy Largo!')
      .required('ingrese un apellido'),
    documentId: Yup.string()
      .matches(/^[0-9]+$/, 'Deben ser solo numeros')
      .min(5, 'No parece un documento valido')
      .required('Cedula es requerida'),
    course: Yup.string().required('Seleccione un curso'),
    resolution: Yup.string().required('Seleccione una resolucion'),
    company: Yup.string(),
    address: Yup.string(),
    phone: Yup.string().matches(/^[0-9]+$/, 'Ingrese un numero de telefono valido'),
    email: Yup.string().email('No parece un email valido'),
    notes: Yup.string().max(50, 'Ingrese una nota maximo de 50 caracteres')
  });

  async function navigateAfterTwoSeconds(url) {
    const timeOut = setTimeout(() => {
      navigate(url);
    }, 200);
    return () => clearTimeout(timeOut);
  }

  const handleOnSubmit = async () => {
    const response = await addStudent(values);
    await navigateAfterTwoSeconds(`/admin/students/${response}`);
    setIsDirty(false);
    handleToast('Alumno creado');
  };
  const onSubmit = async () => {
    try {
      await handleOnSubmit();
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
  const { errors, values, isSubmitting, handleSubmit, setFieldValue } = formik;

  const contextualSaveBar = isDirty && (
    <ContextualSaveBar
      message="Cambios sin guardar"
      saveAction={{
        onAction: handleSubmit,
        loading: isSubmitting
      }}
      discardAction={{
        onAction: () => {}
      }}
    />
  );

  const modalPrompt = showPrompt ? (
    <ModalConfirm
      open={showPrompt}
      confirmAction={confirmNavigation}
      cancelAction={cancelNavigation}
      title="¿Salir de la página sin guardar los cambios?"
      primaryActionTitle="Abandonar pagina"
      secondaryActionTitle="Permanecer"
      bodyText="Al salir de esta página, se eliminarán todos los cambios sin guardar."
    />
  ) : null;

  return (
    <Page
      breadcrumbs={[{ content: 'Alumnos', url: '/admin/students' }]}
      title="Nuevo Alumno"
      compactTitle
    >
      {contextualSaveBar}
      {modalPrompt}
      <FormikProvider value={values}>
        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
          <div style={{ marginBottom: '6rem' }}>
            <Layout>
              <Layout.Section>
                {Object.values(errors).length >= 1 && (
                  <Banner
                    title="Para guardar este alumno, se debe realizar 1 cambio"
                    status="critical"
                  >
                    {Object.values(errors).map((error, index) => (
                      <List.Item key={index}>{error}</List.Item>
                    ))}
                  </Banner>
                )}
              </Layout.Section>
              <Layout.AnnotatedSection
                id="StudentMainInfo"
                title="Información principal del alumno"
                // description="Shopify and your customers will use this information to contact you."
              >
                <Card sectioned>
                  <FormLayout>
                    <FormLayout.Group>
                      <TextField
                        label="Nombres"
                        placeholder="Nombres"
                        value={values.firstname}
                        onChange={(value) => setFieldValue('firstname', value)}
                      />
                      <TextField
                        label="Apellidos"
                        placeholder="Apellidos"
                        value={values.lastname}
                        onChange={(value) => setFieldValue('lastname', value)}
                      />
                    </FormLayout.Group>

                    <TextField
                      label="Numero de cedula"
                      placeholder="Numero de cedula"
                      value={values.documentId}
                      onChange={(value) => setFieldValue('documentId', value)}
                    />
                    <Select
                      label="Curso Aprobado"
                      labelInline
                      onChange={(value) => setFieldValue('course', value)}
                      options={courses}
                      value={values.course}
                    />

                    <Select
                      label="Resolucion Vigente"
                      labelInline
                      onChange={(value) => setFieldValue('resolution', value)}
                      options={resolutions}
                      value={values.resolution}
                    />
                  </FormLayout>
                </Card>
              </Layout.AnnotatedSection>
              <Layout.AnnotatedSection
                id="StudentDetails"
                title="Información adicional del alumno"
                // description="Shopify and your customers will use this information to contact you."
              >
                <Card sectioned>
                  <FormLayout>
                    <TextField
                      label="Empresa"
                      placeholder="Empresa"
                      value={values.company}
                      onChange={(value) => setFieldValue('company', value)}
                    />
                    <TextField
                      label="Dirección"
                      placeholder="Dirección"
                      onChange={(value) => setFieldValue('adress', value)}
                      value={values.address}
                    />
                    <TextField
                      label="Email"
                      placeholder="Email"
                      onChange={(value) => setFieldValue('email', value)}
                      value={values.email}
                    />

                    <TextField
                      label="Telefono"
                      placeholder="Telefono"
                      onChange={(value) => setFieldValue('phone', value)}
                      value={values.phone}
                    />
                  </FormLayout>
                </Card>
              </Layout.AnnotatedSection>
              <Layout.AnnotatedSection
                id="studentAdditionalInfo"
                title="Notas"
                description="Agrega notas sobre tu alumno"
              >
                <Card sectioned>
                  <FormLayout>
                    <TextField
                      label="Nota"
                      value={values.notes}
                      onChange={(value) => setFieldValue('notes', value)}
                    />
                  </FormLayout>
                </Card>
              </Layout.AnnotatedSection>
            </Layout>
          </div>
        </Form>
      </FormikProvider>
    </Page>
  );
}
