import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModeProvider } from './contexts/ModeContext.tsx';
import { VisibilityProvider } from './contexts/VisibilityContext.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <VisibilityProvider>
          <App />
        </VisibilityProvider>
      </ModeProvider>
    </QueryClientProvider>
  </StrictMode>
);
