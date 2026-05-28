import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const TeamAttendance = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState(user?.role === 'manager' ? user.department : '');
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamAttendance = async () => {
    setLoading(true);
    try {
      let url = `/attendance/team?date=${date}`;
      if (department) {
        url += `&department=${encodeURIComponent(department)}`;
      }
      const res = await api.get(url);
      setAttendance(res.data);
    } catch (err) {
      console.error('Failed to load team attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAttendance();
  }, [date, department]);

  const filteredAttendance = attendance.filter(item =>
    item.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    item.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (isoString) => {
    if (!isoString) return '–';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const pendingCount = attendance.filter(a => a.status === 'Pending').length;
  const totalCount = attendance.length;

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Team Attendance
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor presence, clock-in times, and working hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-slate-600 dark:text-slate-400">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-slate-600 dark:text-slate-400">Department:</label>
            <select
              value={department}
              disabled={user?.role === 'manager'}
              onChange={(e) => setDepartment(e.target.value)}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">All Departments</option>
              <option value="General">General</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="hr-card p-3 flex flex-col justify-between">
          <span className="font-medium text-slate-500">Total Personnel</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</span>
        </div>
        <div className="hr-card p-3 flex flex-col justify-between">
          <span className="font-medium text-slate-500">Present</span>
          <span className="text-xl font-bold text-green-500 mt-1">{presentCount}</span>
        </div>
        <div className="hr-card p-3 flex flex-col justify-between">
          <span className="font-medium text-slate-500">Absent</span>
          <span className="text-xl font-bold text-red-500 mt-1">{absentCount}</span>
        </div>
        <div className="hr-card p-3 flex flex-col justify-between">
          <span className="font-medium text-slate-500">Pending</span>
          <span className="text-xl font-bold text-amber-500 mt-1">{pendingCount}</span>
        </div>
      </div>

      {/* Table & search */}
      <div className="hr-card p-4 space-y-4">
        <div className="max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team member..."
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-6 text-center animate-pulse">Loading logs...</p>
        ) : filteredAttendance.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-center py-6">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-semibold text-slate-500">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">First In</th>
                  <th className="py-2.5 px-3">Last Out</th>
                  <th className="py-2.5 px-3">Work Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttendance.map((item) => (
                  <tr key={item.user?._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{item.user?.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.user?.email}</p>
                    </td>
                    <td className="py-3 px-3 capitalize">{item.user?.role}</td>
                    <td className="py-3 px-3 capitalize">{item.user?.department || 'General'}</td>
                    <td className="py-3 px-3 capitalize">{item.user?.branch || 'HQ'}</td>
                    <td className="py-3 px-3 font-medium">{formatTime(item.firstSignIn)}</td>
                    <td className="py-3 px-3 font-medium">{formatTime(item.lastSignOut)}</td>
                    <td className="py-3 px-3 font-medium">{item.hours ? `${item.hours} hrs` : '–'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'Present'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : item.status === 'Absent'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamAttendance;
