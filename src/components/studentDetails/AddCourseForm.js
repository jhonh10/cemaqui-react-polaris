import { Form, FormikProvider } from 'formik';
import { Stack, Select } from '@shopify/polaris';
import { courses, resolutions } from '../../json/coursesData';

export const AddCourseForm = ({ values, setFieldValue, error }) => (
  <FormikProvider value={values}>
    <Form autoComplete="off" noValidate>
      <Stack vertical>
        <Select
          label="Curso Aprobado"
          labelInline
          onChange={(value) => setFieldValue('course', value)}
          options={courses}
          value={values.course}
          error={error.course}
        />

        <Select
          label="Resolucion Vigente"
          labelInline
          onChange={(value) => setFieldValue('resolution', value)}
          options={resolutions}
          value={values.resolution}
          error={error.resolution}
        />
      </Stack>
    </Form>
  </FormikProvider>
);
