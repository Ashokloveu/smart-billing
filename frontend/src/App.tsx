import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';

const lazyNamed = (loader: () => Promise<Record<string, unknown>>, exportName: string) =>
  React.lazy(async () => ({ default: (await loader())[exportName] as React.ComponentType<any> }));

const LoginPage = lazyNamed(() => import('./features/auth/LoginPage'), 'LoginPage');
const DashboardPage = lazyNamed(() => import('./features/dashboard/DashboardPage'), 'DashboardPage');
const OnlineStorePage = lazyNamed(() => import('./features/store/OnlineStorePage'), 'OnlineStorePage');
const PartiesPage = lazyNamed(() => import('./features/parties/PartiesPage'), 'PartiesPage');
const ItemsPage = lazyNamed(() => import('./features/items/ItemsPage'), 'ItemsPage');
const SettingsPage = lazyNamed(() => import('./features/settings/SettingsPage'), 'SettingsPage');
const InventoryDashboard = lazyNamed(() => import('./features/inventory/InventoryDashboard'), 'InventoryDashboard');
const TransactionManager = lazyNamed(() => import('./features/transactions/TransactionManager'), 'TransactionManager');
const PosTerminal = lazyNamed(() => import('./features/transactions/PosTerminal'), 'PosTerminal');
const PaymentInPage = lazyNamed(() => import('./features/transactions/PaymentInPage'), 'PaymentInPage');
const ReportsDashboard = lazyNamed(() => import('./features/reports/pages/ReportsDashboard'), 'ReportsDashboard');
const AccountingDashboard = lazyNamed(() => import('./features/accounting/pages/AccountingDashboard'), 'AccountingDashboard');
const BankCashDashboard = lazyNamed(() => import('./features/accounting/pages/BankCashDashboard'), 'BankCashDashboard');
const VatRegisterPage = lazyNamed(() => import('./features/compliance/pages/VatRegisterPage'), 'VatRegisterPage');
const ProcurementPage = lazyNamed(() => import('./features/operations/pages/ProcurementPage'), 'ProcurementPage');
const SalesOrderPage = lazyNamed(() => import('./features/operations/pages/SalesOrderPage'), 'SalesOrderPage');
const WarehouseOperationsPage = lazyNamed(() => import('./features/operations/pages/WarehouseOperationsPage'), 'WarehouseOperationsPage');
const EmployeeDirectoryPage = lazyNamed(() => import('./features/hr/pages/EmployeeDirectoryPage'), 'EmployeeDirectoryPage');
const AttendanceManagementPage = lazyNamed(() => import('./features/hr/pages/AttendanceManagementPage'), 'AttendanceManagementPage');
const PayrollProcessingPage = lazyNamed(() => import('./features/hr/pages/PayrollProcessingPage'), 'PayrollProcessingPage');
const ExecutiveBiPage = lazyNamed(() => import('./features/hr/pages/ExecutiveBiPage'), 'ExecutiveBiPage');
const LeadManagementPage = lazyNamed(() => import('./features/crm/pages/LeadManagementPage'), 'LeadManagementPage');
const OpportunityPipelinePage = lazyNamed(() => import('./features/crm/pages/OpportunityPipelinePage'), 'OpportunityPipelinePage');
const QuotationListPage = lazyNamed(() => import('./features/crm/pages/QuotationListPage'), 'QuotationListPage');
const Customer360ViewPage = lazyNamed(() => import('./features/crm/pages/Customer360ViewPage'), 'Customer360ViewPage');
const SalesTargetsPage = lazyNamed(() => import('./features/crm/pages/SalesTargetsPage'), 'SalesTargetsPage');
const CustomerPortalPage = lazyNamed(() => import('./features/crm/pages/CustomerPortalPage'), 'CustomerPortalPage');
const ManageAccountsPage = lazyNamed(() => import('./features/accounting/pages/ManageAccountsPage'), 'ManageAccountsPage');
const ManageStaffsPage = lazyNamed(() => import('./features/hr/pages/ManageStaffsPage'), 'ManageStaffsPage');
const BusinessCardPage = lazyNamed(() => import('./features/tools/BusinessCardPage'), 'BusinessCardPage');
const BarcodeGeneratorPage = lazyNamed(() => import('./features/tools/BarcodeGeneratorPage'), 'BarcodeGeneratorPage');
const ImportDataPage = lazyNamed(() => import('./features/tools/ImportDataPage'), 'ImportDataPage');

const RouteLoadingFallback = () => (
  <div role="status" aria-live="polite" style={{ padding: 32, color: '#475569' }}>
    Loading workspace…
  </div>
);

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
        <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/online-store" element={<OnlineStorePage />} />
              <Route path="/sales" element={<TransactionManager moduleType="sales" />} />
              <Route path="/sales/payment-in" element={<PaymentInPage />} />
              <Route path="/sales/quotations" element={<QuotationListPage />} />
              <Route path="/sales/return" element={<TransactionManager moduleType="sales" />} />
              <Route path="/pos" element={<PosTerminal />} />
              <Route path="/purchases" element={<TransactionManager moduleType="purchases" />} />
              <Route path="/purchases/payment-out" element={<TransactionManager moduleType="purchases" />} />
              <Route path="/purchases/return" element={<TransactionManager moduleType="purchases" />} />
              <Route path="/parties" element={<PartiesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/inventory" element={<InventoryDashboard />} />
              <Route path="/accounting" element={<AccountingDashboard />} />
              <Route path="/bank-cash" element={<BankCashDashboard />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/compliance" element={<VatRegisterPage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              <Route path="/sales-orders" element={<SalesOrderPage />} />
              <Route path="/operations" element={<WarehouseOperationsPage />} />
              <Route path="/hr/employees" element={<EmployeeDirectoryPage />} />
              <Route path="/hr/attendance" element={<AttendanceManagementPage />} />
              <Route path="/payroll" element={<PayrollProcessingPage />} />
              <Route path="/bi-analytics" element={<ExecutiveBiPage />} />
              <Route path="/crm/leads" element={<LeadManagementPage />} />
              <Route path="/crm/opportunities" element={<OpportunityPipelinePage />} />
              <Route path="/crm/quotations" element={<QuotationListPage />} />
              <Route path="/crm/customer-360" element={<Customer360ViewPage />} />
              <Route path="/crm/targets" element={<SalesTargetsPage />} />
              <Route path="/manage-accounts" element={<ManageAccountsPage />} />
              <Route path="/manage-staffs" element={<ManageStaffsPage />} />
              <Route path="/tools/business-cards" element={<BusinessCardPage />} />
              <Route path="/tools/barcode-generator" element={<BarcodeGeneratorPage />} />
              <Route path="/import/items" element={<ImportDataPage type="items" />} />
              <Route path="/import/parties" element={<ImportDataPage type="parties" />} />
              <Route path="/portal" element={<CustomerPortalPage />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
