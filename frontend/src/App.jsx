import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Holidays from './pages/Holidays';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const AppLayout = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto dark:bg-slate-900">
        <Routes>
          <Route path="/" element={<Dashboard key={user?.role || 'dash'} />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppLayout />} />
      </Route>
    </Routes>
  );
};

export default App;

