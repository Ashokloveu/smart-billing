import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/sales"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Sales & Invoicing Module</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 4 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/purchases"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Purchases & Vendor Bills</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 4 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/parties"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Parties (Customers & Suppliers)</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 2 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/items"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Items & Services Catalog</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 2 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/inventory"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Warehouses & Inventory Subledger</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 3 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/accounting"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>General Journal & Double-Entry Ledger</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 5 Implementation.
                    </p>
                  </div>
                }
              />
              <Route
                path="/reports"
                element={
                  <div style={{ padding: 20 }}>
                    <h2>Nepal IRD VAT & Financial Reports</h2>
                    <p style={{ color: '#64748b', marginTop: 8 }}>
                      Scheduled for Phase 6 Implementation.
                    </p>
                  </div>
                }
              />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
