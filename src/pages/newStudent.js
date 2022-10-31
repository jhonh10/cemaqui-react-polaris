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

export default function NewStudent() {
  const [isDirty, setIsDirty] = useState(true);
  const [showPrompt, confirmNavigation, cancelNavigation] = useCallbackPrompt(isDirty);
  const { handleToast } = useOutletContext();
  const navigate = useNavigate();

  const courses = [
    {
      value: '',
      label: ''
    },
    {
      value: 'Montacarga',
      label: 'Montacarga'
    },
    {
      value: 'Retroexcavadora',
      label: 'Retroexcavadora'
    },
    {
      value: 'Retro Oruga',
      label: 'Retro Oruga'
    }
  ];
  const resolutions = [
    {
      value: '',
      label: ''
    },
    {
      value: 'Resolucion 2888 de 2007 Decreto 4904 de 2009 MEN',
      label: 'Resolucion 2888 de 2007 Decreto 4904 de 2009 MEN'
    },
    {
      value: 'Resolucion 1409 de 2012 Decreto 4904 de 2009 MEN',
      label: 'Resolucion 1409 de 2012 Decreto 4904 de 2009 MEN'
    }
  ];

  const initialValues = {
    firstname: '',
    lastname: '',
    documentId: '',
    course: '',
    resolution: '',
    company: '',
    adress: '',
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
    adress: Yup.string(),
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
  const onSubmit = async () => {
    try {
      await addStudent(values);
      setIsDirty(false);
      await navigateAfterTwoSeconds(`/admin/students/${values.documentId}`);
      handleToast('Alumno creado con exito');
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

  const modalPrompt = showPrompt && (
    <ModalConfirm
      showDialog={showPrompt}
      confirmNavigation={confirmNavigation}
      cancelNavigation={cancelNavigation}
    />
  );

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
                      value={values.adress}
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
