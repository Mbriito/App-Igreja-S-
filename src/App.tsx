import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Schedules } from '@/pages/Schedules';
import { Prayers } from '@/pages/Prayers';
import { Profile } from '@/pages/Profile';
import { Admin } from '@/pages/Admin';
import { Login, Register } from '@/pages/Auth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-100 rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#df982a] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="mt-8 flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em] animate-pulse">A IGREJA DA VILA</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SÉ</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="escalas" element={<Schedules />} />
            <Route path="oracao" element={<Prayers />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="admin" element={<Admin />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
