import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout & Protected Route
import Layout from './components/Layout';
import ProtectedRoute from './auth/ProtectedRoute';

// Public Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import LaidOffNotice from './pages/auth/LaidOffNotice';

// HR Pages
import HRDashboard from './pages/hr/HRDashboard';
import EmployeeDirectory from './pages/hr/EmployeeDirectory';
import DepartmentManagement from './pages/hr/DepartmentManagement';
import ParameterConfig from './pages/hr/ParameterConfig';
import EvaluateEmployee from './pages/hr/EvaluateEmployee';
import HRPromotionReadiness from './pages/hr/PromotionReadiness';
import AnalyticsReports from './pages/hr/AnalyticsReports';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import TeamEvaluations from './pages/manager/TeamEvaluations';
import ManagerPromotionReadiness from './pages/manager/PromotionReadiness';
import ParameterChangeRequests from './pages/manager/ParameterChangeRequests';
import TeamAnalytics from './pages/manager/TeamAnalytics';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EvaluationHistory from './pages/employee/EvaluationHistory';
import GrowthGoals from './pages/employee/GrowthGoals';
import Profile from './pages/employee/Profile';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/laid-off',
    element: <LaidOffNotice />,
  },

  // HR Portal Routes
  {
    path: '/hr',
    element: (
      <ProtectedRoute allowedRoles={['HR']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HRDashboard /> },
      { path: 'employees', element: <EmployeeDirectory /> },
      { path: 'departments', element: <DepartmentManagement /> },
      { path: 'parameters', element: <ParameterConfig /> },
      { path: 'evaluate', element: <EvaluateEmployee /> },
      { path: 'promotions', element: <HRPromotionReadiness /> },
      { path: 'analytics', element: <AnalyticsReports /> },
    ],
  },

  // Manager Portal Routes
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: 'evaluations', element: <TeamEvaluations /> },
      { path: 'promotions', element: <ManagerPromotionReadiness /> },
      { path: 'change-requests', element: <ParameterChangeRequests /> },
      { path: 'analytics', element: <TeamAnalytics /> },
    ],
  },

  // Employee Portal Routes
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'MANAGER']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <EmployeeDashboard /> },
      { path: 'history', element: <EvaluationHistory /> },
      { path: 'goals', element: <GrowthGoals /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
