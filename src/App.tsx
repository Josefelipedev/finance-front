import { BrowserRouter as Router, Routes, Route } from 'react-router';

import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import NotFound from './pages/OtherPage/NotFound';
import UserProfiles from './pages/UserProfiles';
import ResetPassword from './pages/AuthPages/ResetPassword';
import TwoStepVerification from './pages/AuthPages/TwoStepVerification';
import Success from './pages/OtherPage/Success';
import AppLayout from './layout/AppLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import ProtectedRoute from './components/protected-route';
import AuthChecker from './components/auth-checker';
import PublicRoute from './components/public-route';
import FinancePage from './pages/FInance/FinancePage.tsx';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthChecker>
        <Routes>
          {/* Rotas Públicas (sem autenticação necessária) */}
          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/two-step-verification" element={<TwoStepVerification />} />
          </Route>

          {/* Rotas Protegidas (requerem autenticação) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<FinancePage />} />

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
            </Route>
          </Route>

          {/* Rotas de Erro (acessíveis por todos) */}
          <Route path="*" element={<NotFound />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </AuthChecker>
    </Router>
  );
}
