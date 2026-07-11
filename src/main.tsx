import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'swiper/swiper-bundle.css';
import 'simplebar-react/dist/simplebar.min.css';
import App from './App.tsx';
import { AppWrapper } from './components/common/PageMeta.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.tsx';
import { Toaster } from './components/ui/sonner/sonner.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

// Chunk obsoleto após deploy: quando um import dinâmico (rota lazy) falha porque o
// hash do arquivo mudou, o Vite emite 'vite:preloadError'. Recarrega uma vez para
// pegar o index.html + chunks novos (com guarda de 10s para não entrar em loop).
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('preloadErrorReloadAt') || '0');
  if (Date.now() - last > 10000) {
    sessionStorage.setItem('preloadErrorReloadAt', String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <StrictMode>
          <ThemeProvider>
            <AppWrapper>
              <App />
              <Toaster />
            </AppWrapper>
          </ThemeProvider>
        </StrictMode>
      </AuthProvider>
    </GoogleOAuthProvider>
  </ErrorBoundary>
);
