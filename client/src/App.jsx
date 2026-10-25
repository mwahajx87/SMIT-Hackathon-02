import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { apiRequest } from './lib/api.js';

import { Login } from './features/auth/Login.jsx';
import { ChangePassword } from './features/auth/ChangePassword.jsx';
import { SetupScreen } from './features/setup/SetupScreen.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { OrganizationScreen } from './features/org/OrganizationScreen.jsx';
import { UsersScreen } from './features/users/UsersScreen.jsx';
import { EmployeesList } from './features/employees/EmployeesList.jsx';
import { Employee360 } from './features/employees/Employee360.jsx';
import { MyProfile } from './features/profile/MyProfile.jsx';
import { MyAttendance } from './features/attendance/MyAttendance.jsx';
import { AttendanceBoard } from './features/attendance/AttendanceBoard.jsx';
import { MyLeave } from './features/leave/MyLeave.jsx';
import { LeaveInbox } from './features/leave/LeaveInbox.jsx';
import { PayrollScreen } from './features/payroll/PayrollScreen.jsx';
import { MyPayslips } from './features/payroll/MyPayslips.jsx';
import { AdminDashboard } from './features/dashboard/AdminDashboard.jsx';
import { HrDashboard } from './features/dashboard/HrDashboard.jsx';
import { EmployeeDashboard } from './features/dashboard/EmployeeDashboard.jsx';
import { AnnouncementsScreen } from './features/comms/AnnouncementsScreen.jsx';
import { AuditScreen } from './features/audit/AuditScreen.jsx';
import { IntroScreen } from './features/intro/IntroScreen.jsx';
import { Skeleton } from './components/ui/Skeleton.jsx';

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'hr') return <HrDashboard />;
  return <EmployeeDashboard />;
}

function LeaveRouter() {
  const { user } = useAuth();
  if (['admin', 'hr'].includes(user?.role)) {
    return <LeaveInbox />;
  }
  return <MyLeave />;
}

function AttendanceRouter() {
  const { user } = useAuth();
  if (['admin', 'hr'].includes(user?.role)) {
    return <AttendanceBoard />;
  }
  return <MyAttendance />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-sm text-[#6B7385]">
        You do not have access to this page.
      </div>
    );
  }

  return children;
}

function InitialRouteCheck({ children }) {
  const [setupComplete, setSetupComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await apiRequest('/setup/status');
        setSetupComplete(res.setupComplete);
      } catch (err) {
        setSetupComplete(true);
      } finally {
        setChecking(false);
      }
    }
    checkSetup();
  }, []);

  if (checking) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <span className="text-sm text-[#6B7385]">Loading HCM Lite...</span>
      </div>
    );
  }

  if (setupComplete === false) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/intro" element={<IntroScreen />} />
          <Route path="/setup" element={<SetupScreen />} />
          <Route
            path="/login"
            element={
              <InitialRouteCheck>
                <Login />
              </InitialRouteCheck>
            }
          />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Protected Routes inside AppShell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={<DashboardRouter />}
            />
            <Route
              path="/org"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <OrganizationScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <EmployeesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
                  <Employee360 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendanceRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <LeaveRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/my"
              element={
                <ProtectedRoute>
                  <MyLeave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <PayrollScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <MyPayslips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <AnnouncementsScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditScreen />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
