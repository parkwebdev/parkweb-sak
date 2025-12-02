import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WidgetPage from './pages/WidgetPage';
// Use minimal widget CSS instead of full index.css
import './widget.css';

// Minimal QueryClient for widget - no refetching, minimal overhead
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Simple router replacement - just render WidgetPage directly
const WidgetApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WidgetPage />
    </QueryClientProvider>
  );
};

createRoot(document.getElementById('root')!).render(<WidgetApp />);
