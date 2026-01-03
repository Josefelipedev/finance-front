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
createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="542189176362-hhg8cin8gqog2839dcsjenouppinb3si.apps.googleusercontent.com">
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
);
