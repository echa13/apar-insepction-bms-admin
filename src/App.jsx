import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AparProvider } from './shared/context/AparContext';

// Shared Pages
import LoginPage from './shared/pages/LoginPage';

// Admin Pages & Layout
import AdminLayout from './admin/components/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminAparManage from './admin/pages/AdminAparManage';
import AdminMaintenances from './admin/pages/AdminMaintenances';
import AdminRigs from './admin/pages/AdminRigs';
import AdminReports from './admin/pages/AdminReports';

// User Pages & Layout (Field Inspector)
import UserLayout from './user/components/UserLayout';
import UserDashboard from './user/pages/UserDashboard';
import UserInspect from './user/pages/UserInspect';
import UserMaintenances from './user/pages/UserMaintenances';

export default function App() {
  return (
    <AparProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="apars" element={<AdminAparManage />} />
            <Route path="maintenances" element={<AdminMaintenances />} />
            <Route path="rigs" element={<AdminRigs />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* User Routes (Field Inspector) */}
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="inspect/:id" element={<UserInspect />} />
            <Route path="maintenances" element={<UserMaintenances />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AparProvider>
  );
}
