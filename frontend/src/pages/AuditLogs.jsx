import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/audit-logs?page=${page}&limit=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (action) url += `&action=${encodeURIComponent(action)}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

      const res = await api.get(url);
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          System Audit Logs
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Review security events, access logs, and administrative actions.
        </p>
      </div>

      {/* Filter panel */}
      <div className="hr-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Search Keywords</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search details or action..."
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Action Type</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGIN_2FA_SUCCESS">LOGIN_2FA_SUCCESS</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="SIGNUP">SIGNUP</option>
              <option value="2FA_ENABLE">2FA_ENABLE</option>
              <option value="2FA_DISABLE">2FA_DISABLE</option>
              <option value="LEAVE_SUBMIT">LEAVE_SUBMIT</option>
              <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
              <option value="LEAVE_REJECTED">LEAVE_REJECTED</option>
              <option value="LEAVE_CANCEL">LEAVE_CANCEL</option>
              <option value="ATTENDANCE_SIGN_IN">ATTENDANCE_SIGN_IN</option>
              <option value="ATTENDANCE_SIGN_OUT">ATTENDANCE_SIGN_OUT</option>
              <option value="HOLIDAY_CREATE">HOLIDAY_CREATE</option>
              <option value="HOLIDAY_DELETE">HOLIDAY_DELETE</option>
              <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
              <option value="DOCUMENT_DELETE">DOCUMENT_DELETE</option>
              <option value="PAYSLIP_CREATE">PAYSLIP_CREATE</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-sm transition-colors"
            >
              Filter
            </button>
            {(search || action || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="hr-card p-4 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center animate-pulse">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-center py-8">No matching logs found.</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-semibold text-slate-500">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-2.5 px-3 font-medium text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.user ? (
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{log.user.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Anonymous / System</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            log.action.includes('FAIL') || log.action.includes('REJECT')
                              ? 'bg-red-100 dark:bg-red-950/20 text-red-700'
                              : log.action.includes('SUCCESS') || log.action.includes('APPROV') || log.action.includes('SIGN_IN')
                              ? 'bg-green-100 dark:bg-green-950/20 text-green-700'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 leading-normal max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{log.ipAddress || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-slate-500">Showing {logs.length} of {total} records</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                >
                  ‹ Previous
                </button>
                <span className="font-semibold">Page {page} of {pages}</span>
                <button
                  type="button"
                  disabled={page === pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
