import { Form, FormikProvider } from 'formik';
import { TextField, Stack } from '@shopify/polaris';

export const DocumentIdForm = ({ values, setFieldValue, error }) => (
  <FormikProvider value={values}>
    <Form autoComplete="off" noValidate>
      <Stack vertical>
        <TextField
          placeholder="Editar documento"
          value={values.documentId}
          onChange={(value) => setFieldValue('documentId', value)}
          autoComplete="off"
          error={error}
        />
      </Stack>
    </Form>
  </FormikProvider>
);
