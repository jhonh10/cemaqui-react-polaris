import {
  Page,
  Layout,
  SkeletonPage,
  Card,
  TextContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from "@shopify/polaris";
import { useOutletContext } from "react-router-dom";

export default function Home() {
  const { isFetching } = useOutletContext();
  const actualPageMarkup = (
    <Page title="Inicio" fullWidth>
      <Layout>
        {/* {skipToContentTarget} */}
        <Layout.AnnotatedSection>
          <h1>Hola Bienvenido.</h1>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );

  const loadingPageMarkup = (
    <SkeletonPage fullWidth>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={9} />
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );

  const pageMarkup = isFetching ? loadingPageMarkup : actualPageMarkup;

  return pageMarkup;
}
