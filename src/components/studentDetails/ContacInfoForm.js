import { Form, FormikProvider } from "formik";
import { TextField, Stack } from "@shopify/polaris";

export const ContactInfoForm = ({ values, setFieldValue, error }) => (
  <FormikProvider value={values}>
    <Form autoComplete="off" noValidate>
      <Stack vertical>
        <TextField
          placeholder="Email"
          value={values.email}
          onChange={(value) => setFieldValue("email", value)}
          autoComplete="off"
          error={error.email}
        />
        <TextField
          placeholder="Numero de telefono"
          value={values.phone}
          onChange={(value) => setFieldValue("phone", value)}
          autoComplete="off"
          error={error.phone}
        />
      </Stack>
    </Form>
  </FormikProvider>
);
