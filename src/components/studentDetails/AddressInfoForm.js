import { Form, FormikProvider } from 'formik';
import { TextField, Stack } from '@shopify/polaris';

export const AddressInfoForm = ({ values, setFieldValue, error }) => (
  <FormikProvider value={values}>
    <Form autoComplete="off" noValidate>
      <Stack vertical>
        <TextField
          placeholder="Ej: Calle 12 # ..."
          value={values.address}
          onChange={(value) => setFieldValue('address', value)}
          autoComplete="off"
          error={error.address}
        />
      </Stack>
    </Form>
  </FormikProvider>
);
