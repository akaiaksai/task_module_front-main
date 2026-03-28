import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './global.css';
import { Toaster } from 'sonner';

const FIFTEEN_MIN = 15 * 60 * 1000;

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: FIFTEEN_MIN,
      gcTime: FIFTEEN_MIN + 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>
);
