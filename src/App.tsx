import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppInitializer } from './components/layout/AppInitializer';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages for perfect code splitting and high performance under Vite!
const Login = React.lazy(() => import('./pages/Login'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminTransfers = React.lazy(() => import('./pages/admin/AdminTransfers'));
const AdminWorkers = React.lazy(() => import('./pages/admin/AdminWorkers'));
const DeliveryStaffDashboard = React.lazy(() => import('./pages/delivery-staff/DeliveryStaffDashboard'));
const InventoryHandlerDashboard = React.lazy(() => import('./pages/inventory-handler/InventoryHandlerDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerInventory = React.lazy(() => import('./pages/manager/ManagerInventory'));
const ManagerTeam = React.lazy(() => import('./pages/manager/ManagerTeam'));
const ManagerTransfers = React.lazy(() => import('./pages/manager/ManagerTransfers'));
const WarehouseStaffDashboard = React.lazy(() => import('./pages/warehouse-staff/WarehouseStaffDashboard'));

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <Suspense fallback={
          <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard Routes with DashboardLayout */}
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/transfers" element={<AdminTransfers />} />
              <Route path="/admin/workers" element={<AdminWorkers />} />
              
              <Route path="/delivery-staff" element={<DeliveryStaffDashboard />} />
              <Route path="/inventory-handler" element={<InventoryHandlerDashboard />} />
              <Route path="/warehouse-staff" element={<WarehouseStaffDashboard />} />
              
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/inventory" element={<ManagerInventory />} />
              <Route path="/manager/team" element={<ManagerTeam />} />
              <Route path="/manager/transfers" element={<ManagerTransfers />} />
            </Route>

            {/* Catch-all and Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AppInitializer>
    </BrowserRouter>
  );
}
