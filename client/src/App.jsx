import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
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
import { AdminRoute } from './components/AdminRoute.jsx';

import { ErrorBoundary } from './components/ErrorBoundary.jsx';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <ErrorBoundary>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/expenses" element={<ExpenseListPage />} />
                  <Route path="/expenses/new" element={<AddExpensePage />} />
                  <Route path="/expenses/:id/edit" element={<EditExpensePage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                </Route>

                {/* Admin Only Route */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
