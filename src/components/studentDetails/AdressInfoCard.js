import { Button, Card, Stack, Subheading, Text, TextContainer } from '@shopify/polaris';
import React from 'react';

export const AdressInfoCard = ({ adress }) => (
  <Card.Section>
    <Stack vertical>
      <Stack>
        <Stack.Item fill>
          <Subheading>Dirección predeterminada</Subheading>
        </Stack.Item>
        <Button plain>Gestionar</Button>
      </Stack>
      <Stack vertical>
        <TextContainer spacing="tight">
          <Stack vertical>
            <Stack vertical spacing="tight">
              <Text>Calle 8a 11-55</Text>
              <Text>Bogota, Colombia</Text>
            </Stack>
          </Stack>
        </TextContainer>
      </Stack>
    </Stack>
  </Card.Section>
);
