/**
 * =============================================================================
 * MAIN APP COMPONENT
 * =============================================================================
 * 
 * MENTOR NOTE: This is the root component that sets up routing and layout.
 * Protected routes require authentication (admin role).
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { Sidebar } from './components/Sidebar';
import { AlertPanel } from './components/AlertPanel';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveMap } from './pages/LiveMap';
import { Verifications } from './pages/Verifications';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Companies } from './pages/Companies';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Layout with sidebar
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connect } = useSocket();

  // Connect to Socket.io when authenticated
  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <AlertPanel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <LiveMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Vehicles />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Drivers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Companies />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifications"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Verifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Alerts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
