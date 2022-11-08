import { Badge, Card, List, Stack, TextStyle } from '@shopify/polaris';

export const CoursesCard = ({ course, createdAt, status }) => (
  <Card
    title="Cursos realizados"
    primaryFooterAction={{ content: 'Agregar curso', onAction: () => console.log('text') }}
  >
    <Card.Section subdued>
      <Stack vertical spacing="tight">
        <Stack spacing="tight" distribution="equalSpacing">
          <Stack.Item fill>
            <List.Item>{course}</List.Item>
            <TextStyle variation="subdued">{`El ${createdAt}`}</TextStyle>
          </Stack.Item>
          <Badge status="success">Vigente</Badge>
        </Stack>
      </Stack>
    </Card.Section>
  </Card>
);
