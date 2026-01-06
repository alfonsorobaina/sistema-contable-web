import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layout/Layout';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CompanySettings from './pages/CompanySettings';
import Accounting from './pages/Accounting';
import Invoicing from './pages/Invoicing';
import Payables from './pages/Payables';
import Inventory from './pages/Inventory';
import Banking from './pages/Banking';

import Payroll from './pages/Payroll';
import DataMigration from './pages/DataMigration';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="company/settings" element={<CompanySettings />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="invoicing" element={<Invoicing />} />
            <Route path="payables" element={<Payables />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="banking" element={<Banking />} />

            <Route path="payroll" element={<Payroll />} />
            <Route path="migration" element={<DataMigration />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
