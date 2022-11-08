import { Form, FormikProvider } from 'formik';
import { TextField, Stack } from '@shopify/polaris';

export const NotesForm = ({ values, setFieldValue }) => (
  <FormikProvider value={values}>
    <Form autoComplete="off" noValidate>
      <Stack vertical>
        <TextField
          placeholder="Agregar una nota"
          showCharacterCount
          value={values.notes}
          onChange={(value) => setFieldValue('notes', value)}
          autoComplete="off"
        />
      </Stack>
    </Form>
  </FormikProvider>
);
