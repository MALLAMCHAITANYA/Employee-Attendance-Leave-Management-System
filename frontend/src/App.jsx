import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Holidays from './pages/Holidays';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamAttendance from './pages/TeamAttendance';
import Announcements from './pages/Announcements';
import Documents from './pages/Documents';
import Payslips from './pages/Payslips';
import AuditLogs from './pages/AuditLogs';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const AppLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-900">
      {/* Mobile Header Bar */}
      <header className="md:hidden bg-slate-900 text-slate-100 flex items-center justify-between px-4 py-3.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 focus:outline-none"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold tracking-tight text-base">Work Space</span>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with isOpen and onClose control */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto dark:bg-slate-900">
        <Routes>
          <Route path="/" element={<Dashboard key={user?.role || 'dash'} />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/holidays" element={<Holidays />} />
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/team-attendance" element={<TeamAttendance />} />
            </>
          )}
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/payslips" element={<Payslips />} />
          {user?.role === 'admin' && (
            <Route path="/audit-logs" element={<AuditLogs />} />
          )}
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

