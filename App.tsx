
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryListPage from './pages/inventory/InventoryListPage';
import DocumentListPage from './pages/documents/DocumentListPage';
import BulkUploadPage from './pages/bulk_upload/BulkUploadPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import AuditLogPage from './pages/admin/AuditLogPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';
import ProviderListPage from './pages/providers/ProviderListPage'; 
import WorkOrderConsumptionPage from './pages/consumptions/WorkOrderConsumptionPage'; 
import RequesterListPage from './pages/requesters/RequesterListPage';
import MaterialRequestListPage from './pages/material_requests/MaterialRequestListPage'; // New
import InformeConsumosPage from './pages/reports/InformeConsumosPage';
import InformeMovimientosPage from './pages/reports/InformeMovimientosPage';
import InformeValoracionStockPage from './pages/reports/InformeValoracionStockPage';
import InformeTiemposEsperaPage from './pages/reports/InformeTiemposEsperaPage'; 
import InformePersonalizadoPage from './pages/reports/InformePersonalizadoPage'; 
import UserRolesDescriptionPage from './pages/admin/UserRolesDescriptionPage'; // Added new page
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './hooks/useAuth';
import { useConfig } from './contexts/ConfigContext'; // Import useConfig

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const isTokenValid = (tok: string | null) => {
    if (!tok) return false;
    try {
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };
  if (!user || !isTokenValid(token)) {
    if (token && !isTokenValid(token)) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { config } = useConfig();

  useEffect(() => {
    if (config.uiTheme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.uiTheme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/inventory" element={<InventoryListPage />} />
                  <Route path="/documents" element={<DocumentListPage />} />
                  <Route path="/material-requests" element={<MaterialRequestListPage />} /> 
                  <Route path="/providers" element={<ProviderListPage />} /> 
                  <Route path="/requesters" element={<RequesterListPage />} />
                  <Route path="/consumptions" element={<WorkOrderConsumptionPage />} /> 
                  <Route path="/bulk-upload" element={<BulkUploadPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="/reports/consumptions" element={<InformeConsumosPage />} />
                  <Route path="/reports/inventory-movements" element={<InformeMovimientosPage />} />
                  <Route path="/reports/stock-valuation" element={<InformeValoracionStockPage />} />
                  <Route path="/reports/lead-time" element={<InformeTiemposEsperaPage />} />
                  <Route path="/reports/custom-builder" element={<InformePersonalizadoPage />} />


                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route path="/admin/audit-log" element={<AuditLogPage />} />
                  <Route path="/admin/config" element={<SystemConfigPage />} />
                  <Route path="/admin/user-roles-description" element={<UserRolesDescriptionPage />} /> {/* Added route */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;