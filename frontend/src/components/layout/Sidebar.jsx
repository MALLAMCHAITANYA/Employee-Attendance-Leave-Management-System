import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleReadNotification = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/leaves', label: 'Leave' },
    { to: '/holidays', label: 'Holidays' }
  ];

  if (user?.role === 'manager' || user?.role === 'admin') {
    links.push({ to: '/manager', label: 'Manager Dashboard' });
    links.push({ to: '/team-attendance', label: 'Team Attendance' });
  }

  links.push({ to: '/announcements', label: 'Announcements' });
  links.push({ to: '/documents', label: 'Documents' });
  links.push({ to: '/payslips', label: 'Payslips' });

  if (user?.role === 'admin') {
    links.push({ to: '/audit-logs', label: 'Audit Logs' });
  }

  links.push({ to: '/profile', label: 'Profile' });
  links.push({ to: '/settings', label: 'Settings' });

  return (
    <aside className={`w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 fixed md:relative inset-y-0 left-0 z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
      {/* Header section */}
      <div className="p-6 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            onClick={() => onClose && onClose()}
            className="text-xl font-semibold tracking-tight hover:text-primary-400 transition-colors truncate"
          >
            Work Space
          </Link>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1 rounded-full text-slate-400 hover:text-white focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-2 z-50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs max-h-80 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <span>Notifications</span>
                  </div>
                  {unreadNotifications.length === 0 ? (
                    <p className="px-4 py-3 text-slate-400 text-center">No notifications</p>
                  ) : (
                    <>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {unreadNotifications.map(n => (
                          <div
                            key={n._id}
                            className="px-4 py-2.5 flex justify-between items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 bg-primary-50/20 dark:bg-primary-600/5 font-medium"
                          >
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleReadNotification(n._id)}
                            >
                              <p className="leading-normal text-slate-900 dark:text-slate-100">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReadNotification(n._id);
                              }}
                              className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          </div>
                        ))}
                      </div>
                      {unreadNotifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center sticky bottom-0">
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="w-full text-center py-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-[10px] hover:underline"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User avatar + name info */}
        <Link
          to="/profile"
          onClick={() => onClose && onClose()}
          className="flex items-center gap-3 mt-1 p-1 rounded-lg hover:bg-slate-800/60 transition-colors group cursor-pointer"
        >
          <div className="h-9 w-9 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-400 transition-all">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-slate-100 group-hover:text-primary-400 transition-colors">{user?.name}</span>
            <span className="text-xs text-slate-400 truncate capitalize">{user?.role}</span>
          </div>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
