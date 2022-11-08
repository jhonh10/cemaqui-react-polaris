import { Button, Card, Stack, Subheading, Text, TextContainer, TextStyle } from '@shopify/polaris';
import React from 'react';

export const ContactInfoCard = ({ email, phone }) => {
  const studentEmail = email ? (
    <Text>{email}</Text>
  ) : (
    <TextStyle variation="subdued">No se ingreso un correo electronico</TextStyle>
  );

  const studentPhone = phone ? (
    <Text>{`+57 ${phone}`}</Text>
  ) : (
    <TextStyle variation="subdued">No se ingreso un numero de telefono</TextStyle>
  );
  return (
    <Card.Section>
      <Stack vertical>
        <Stack>
          <Stack.Item fill>
            <Subheading>Informacion de contácto</Subheading>
          </Stack.Item>
          <Button plain>Editar</Button>
        </Stack>
        <Stack vertical>
          <TextContainer spacing="tight">
            <Stack vertical>
              <Stack vertical spacing="tight">
                {studentEmail}
                {studentPhone}
              </Stack>
            </Stack>
          </TextContainer>
        </Stack>
      </Stack>
    </Card.Section>
  );
};
