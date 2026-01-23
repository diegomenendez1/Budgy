import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import MainAppLayout from './components/MainAppLayout';
import Welcome from './pages/Welcome';
import Onboarding from './pages/Onboarding';
// import Login from './pages/Login';
// import Register from './pages/Register';

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 bg-blue-500 rounded-full mb-4"></div>
      <div className="text-slate-400 font-medium">Cargando Budgy...</div>
    </div>
  </div>
);

// Route Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
      {/* <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} /> */}
      {/* <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} /> */}

      {/* Protected Routes */}
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

      {/* Redirect root to dashboard (which handles auth check) or welcome */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route path="/*" element={
        <PrivateRoute>
          <MainAppLayout />
        </PrivateRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;