import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AppProvider } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/es.json";
import { AppContainer } from "./components/AppContainer";
import Router from "./routes";

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {/* Mover AppProvider aquí para que envuelva todo, incluso el OfflineUI */}
      <AppProvider i18n={translations}>
        <Router />
      </AppProvider>
    </QueryClientProvider>
  );
}
