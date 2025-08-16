import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModeProvider } from './contexts/ModeContext.tsx';
import { VisibilityProvider } from './contexts/VisibilityContext.tsx';
import { validateEnvironment, logEnvironmentValidation } from './utils/environment-validator';

// 驗證環境變數
const envValidation = validateEnvironment();
logEnvironmentValidation(envValidation);

// 如果環境驗證失敗，顯示錯誤訊息
if (!envValidation.isValid && import.meta.env.NODE_ENV === 'development') {
  console.error('❌ Application startup blocked due to missing environment variables');
  console.error('Please copy .env.example to .env and fill in the required values');
}

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
