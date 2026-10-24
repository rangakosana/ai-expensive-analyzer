import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { PublicRoute } from './components/PublicRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
import { Navbar } from './components/Navbar.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExpenseListPage } from './pages/ExpenseListPage.jsx';
import { AddExpensePage } from './pages/AddExpensePage.jsx';
import { EditExpensePage } from './pages/EditExpensePage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

/**
 * AppLayout renders the top navigation bar and standard application shell
 * strictly for authenticated application pages (Dashboard, Expenses, Calendar, Insights, Admin).
 */
const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Standalone Welcome / Landing routes (always accessible without app navbar) */}
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />

              {/* Guest / Public Routes (Redirects authenticated users to /dashboard; rendered without app navbar) */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected Application Routes (wrapped in AppLayout with Navbar) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/expenses" element={<ExpenseListPage />} />
                  <Route path="/expenses/new" element={<AddExpensePage />} />
                  <Route path="/expenses/:id/edit" element={<EditExpensePage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  {/* Admin Only Route */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
