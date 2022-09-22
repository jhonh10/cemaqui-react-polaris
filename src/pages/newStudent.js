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

export default function NewStudent() {
  const isDirty = true;
  const [showPrompt, confirmNavigation, cancelNavigation] = useCallbackPrompt(isDirty);

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
    phone: ''
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
    notes: Yup.string().max(50, 'Ingrese una nota maximo de 50 caracteres')
  });
  const onSubmit = () => {
    try {
      console.log('submitting...');
      setTimeout(() => {
        handleReset();
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit
  });
  const { errors, values, isSubmitting, handleSubmit, setFieldValue, handleReset } = formik;

  const contextualSaveBar = isDirty ? (
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
  ) : null;

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
