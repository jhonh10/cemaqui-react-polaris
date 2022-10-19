import {
  Page,
  Card,
  Layout,
  Stack,
  TextStyle,
  Heading,
  Button,
  Badge,
  Text,
  List,
  Subheading,
  TextContainer,
  PageActions
} from '@shopify/polaris';

export default function EditStudent() {
  return (
    <Page
      breadcrumbs={[{ content: 'Alumnos', url: '/admin/students' }]}
      title="Jhon Palacios Arroyave"
      pagination={{
        hasPrevious: true,
        hasNext: true
      }}
      subtitle="Alumno desde hace mas de 1 año"
    >
      <Layout>
        <Layout.Section>
          <Card
            title="Cursos realizados"
            primaryFooterAction={{ content: 'Agregar curso', onAction: () => console.log('text') }}
          >
            <Card.Section subdued>
              <Stack vertical spacing="tight">
                <Stack spacing="tight" distribution="equalSpacing">
                  <Stack.Item fill>
                    <List.Item>Retroexcavadora</List.Item>
                    <TextStyle variation="subdued">El 15 de septimbre de 2022</TextStyle>
                  </Stack.Item>
                  <Badge status="success">Vigente</Badge>
                </Stack>
              </Stack>
            </Card.Section>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card sectioned>
            <Stack vertical>
              <Stack>
                <Stack.Item fill>
                  <Heading>Notas</Heading>
                </Stack.Item>
                <Button plain>Editar</Button>
              </Stack>
              <TextStyle variation="subdued">No hay notas sobre este alumno.</TextStyle>
            </Stack>
          </Card>
          <Card>
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
                        <Text>1013645826</Text>
                      </Stack>
                    </Stack>
                  </TextContainer>
                </Stack>
              </Stack>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <Stack>
                  <Stack.Item fill>
                    <Subheading>Alumno</Subheading>
                  </Stack.Item>
                  <Button plain>Editar</Button>
                </Stack>
                <Stack vertical>
                  <TextContainer spacing="tight">
                    <Stack vertical>
                      <Stack vertical spacing="tight">
                        <Text>jhonhpalacios09@gmail.com</Text>
                        <Text>+57 320 2055666</Text>
                      </Stack>
                    </Stack>
                  </TextContainer>
                </Stack>
              </Stack>
            </Card.Section>
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
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[{ content: 'Eliminar alumno', destructive: true, outline: true }]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
