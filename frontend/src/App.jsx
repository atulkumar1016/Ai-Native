import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TestCases from './pages/TestCases';
import AIGenerator from './pages/AIGenerator';
import APITester from './pages/APITester';
import PlaywrightExecutor from './pages/PlaywrightExecutor';
import BugAnalyzer from './pages/BugAnalyzer';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Admin Route Wrapper Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Secure pipelines routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/testcases"
            element={
              <ProtectedRoute>
                <TestCases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-generator"
            element={
              <ProtectedRoute>
                <AIGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-tester"
            element={
              <ProtectedRoute>
                <APITester />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playwright-runner"
            element={
              <ProtectedRoute>
                <PlaywrightExecutor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bug-analyzer"
            element={
              <ProtectedRoute>
                <BugAnalyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Admin user routing */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
