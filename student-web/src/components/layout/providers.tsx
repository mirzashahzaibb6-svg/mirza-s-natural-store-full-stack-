'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ApiError } from '@/lib/networking/api-error';
import { useAuthStore } from '@/store/auth-store';

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        // Do not retry client errors (400-499); retry flaky network/5xx up to twice.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);

  // Manual hydration keeps the server HTML and the first client render identical.
  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => useAuthStore.setState({ hydrated: true }));
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" position="bottom-center" toastOptions={{ style: { background: '#1d0a12', border: '1px solid #cfa95a', color: '#f3e9d8' } }} />
    </QueryClientProvider>
  );
}
