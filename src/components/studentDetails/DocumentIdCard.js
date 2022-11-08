import { Button, Card, Stack, Subheading, Text, TextContainer } from '@shopify/polaris';

export const DocumentIdCard = ({ documentId }) => (
  <Card.Section>
    <Stack vertical>
      <Stack>
        <Stack.Item fill>
          <Subheading>Numero de cedula</Subheading>
        </Stack.Item>
        <Button plain>Editar</Button>
      </Stack>
      <Stack vertical>
        <TextContainer>
          <Stack vertical>
            <Stack vertical>
              <Text>{documentId}</Text>
            </Stack>
          </Stack>
        </TextContainer>
      </Stack>
    </Stack>
  </Card.Section>
);
