import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/leaves', label: 'Leave' },
    { to: '/holidays', label: 'Holidays' },
    { to: '/profile', label: 'Profile' },
    { to: '/settings', label: 'Settings' }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="text-xl font-semibold tracking-tight">Work Space</div>
        <div className="mt-2 text-xs text-slate-400">
          Logged in as {user?.name} ({user?.role})
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium ${
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
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-sm font-medium py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

