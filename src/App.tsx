import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';

import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import AuthLanding from './pages/AuthPages/AuthLanding';
import NotFound from './pages/OtherPage/NotFound';
import ResetPassword from './pages/AuthPages/ResetPassword';
import TwoStepVerification from './pages/AuthPages/TwoStepVerification';
import Success from './pages/OtherPage/Success';
import AppLayout from './layout/AppLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import ProtectedRoute from './components/protected-route';
import AuthChecker from './components/auth-checker';
import PublicRoute from './components/public-route';

// Rotas do app carregadas sob demanda (code-splitting por página)
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/app/TransactionsPage'));
const RecurringPage = lazy(() => import('./pages/app/RecurringPage'));
const BudgetPage = lazy(() => import('./pages/app/BudgetPage'));
const ShoppingPage = lazy(() => import('./pages/app/ShoppingPage'));
const PantryPage = lazy(() => import('./pages/app/PantryPage'));
const GroceryPage = lazy(() => import('./pages/app/GroceryPage'));
const CategoriesPage = lazy(() => import('./pages/app/CategoriesPage'));
const AnalyticsPage = lazy(() => import('./pages/app/AnalyticsPage'));
const ReportPage = lazy(() => import('./pages/app/ReportPage'));
const NotificationsPage = lazy(() => import('./pages/app/NotificationsPage'));
const CalendarPage = lazy(() => import('./pages/app/CalendarPage'));
const SearchPage = lazy(() => import('./pages/app/SearchPage'));
const CouplePage = lazy(() => import('./pages/app/CouplePage'));
const AccountsPage = lazy(() => import('./pages/app/AccountsPage'));
const MealPlannerPage = lazy(() => import('./pages/MealPlanner/MealPlannerPage'));
const UserProfiles = lazy(() => import('./pages/UserProfiles'));

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthChecker>
        <Routes>
          {/* Rotas Públicas (sem autenticação necessária) */}
          <Route element={<PublicRoute />}>
            <Route path="/welcome" element={<AuthLanding />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/two-step-verification" element={<TwoStepVerification />} />
          </Route>

          {/* Rotas Protegidas (requerem autenticação) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<DashboardPage />} />
              <Route path="/transacoes" element={<TransactionsPage />} />
              <Route path="/recorrentes" element={<RecurringPage />} />
              <Route path="/orcamento" element={<BudgetPage />} />
              <Route path="/compras" element={<ShoppingPage />} />
              <Route path="/despensa" element={<PantryPage />} />
              <Route path="/precos" element={<GroceryPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/analises" element={<AnalyticsPage />} />
              <Route path="/relatorio" element={<ReportPage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/casal" element={<CouplePage />} />
              <Route path="/contas" element={<AccountsPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
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
