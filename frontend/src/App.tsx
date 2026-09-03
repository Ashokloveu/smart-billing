import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/LoginPage';
import { PartiesPage } from './features/parties/PartiesPage';
import { ItemsPage } from './features/items/ItemsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { InventoryDashboard } from './features/inventory/InventoryDashboard';
import { TransactionManager } from './features/transactions/TransactionManager';
import { PosTerminal } from './features/transactions/PosTerminal';
import { ReportsDashboard } from './features/reports/pages/ReportsDashboard';
import { AccountingDashboard } from './features/accounting/pages/AccountingDashboard';
import { VatRegisterPage } from './features/compliance/pages/VatRegisterPage';
import { ProcurementPage } from './features/operations/pages/ProcurementPage';
import { SalesOrderPage } from './features/operations/pages/SalesOrderPage';
import { WarehouseOperationsPage } from './features/operations/pages/WarehouseOperationsPage';
import { EmployeeDirectoryPage } from './features/hr/pages/EmployeeDirectoryPage';
import { AttendanceManagementPage } from './features/hr/pages/AttendanceManagementPage';
import { PayrollProcessingPage } from './features/hr/pages/PayrollProcessingPage';
import { ExecutiveBiPage } from './features/hr/pages/ExecutiveBiPage';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ReportsDashboard />} />
              <Route path="/sales" element={<TransactionManager moduleType="sales" />} />
              <Route path="/pos" element={<PosTerminal />} />
              <Route path="/purchases" element={<TransactionManager moduleType="purchases" />} />
              <Route path="/parties" element={<PartiesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/inventory" element={<InventoryDashboard />} />
              <Route path="/accounting" element={<AccountingDashboard />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/compliance" element={<VatRegisterPage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              <Route path="/sales-orders" element={<SalesOrderPage />} />
              <Route path="/operations" element={<WarehouseOperationsPage />} />
              <Route path="/hr/employees" element={<EmployeeDirectoryPage />} />
              <Route path="/hr/attendance" element={<AttendanceManagementPage />} />
              <Route path="/payroll" element={<PayrollProcessingPage />} />
              <Route path="/bi-analytics" element={<ExecutiveBiPage />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
