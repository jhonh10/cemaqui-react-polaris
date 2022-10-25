import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import Router from './routes';

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        cacheTime: Infinity
      }
    }
  });
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
