import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const LEAVE_TYPES = ['Sick', 'Casual', 'Optional'];

const Leaves = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'Casual'
  });
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const loadData = async () => {
    const year = new Date().getFullYear();
    let queryParams = [];
    if (filterType) queryParams.push(`type=${encodeURIComponent(filterType)}`);
    if (filterStatus) queryParams.push(`status=${encodeURIComponent(filterStatus)}`);
    if (filterStartDate) queryParams.push(`startDate=${encodeURIComponent(filterStartDate)}`);
    if (filterEndDate) queryParams.push(`endDate=${encodeURIComponent(filterEndDate)}`);
    const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';

    const pendingParams = [
      filterType && `type=${encodeURIComponent(filterType)}`,
      filterStartDate && `startDate=${encodeURIComponent(filterStartDate)}`,
      filterEndDate && `endDate=${encodeURIComponent(filterEndDate)}`
    ].filter(Boolean).join('&');
    const pendingQueryString = pendingParams ? '?' + pendingParams : '';

    const [myRes, balanceRes] = await Promise.all([
      api.get('/leaves/me' + queryString),
      api.get(`/leaves/balance?year=${year}`)
    ]);
    setLeaves(myRes.data);
    setBalance(balanceRes.data);
    if (user.role === 'manager' || user.role === 'admin') {
      const pending = await api.get('/leaves/pending' + pendingQueryString);
      setPendingLeaves(pending.data);
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, [filterType, filterStatus, filterStartDate, filterEndDate]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await api.post('/leaves', form);
      setForm({ fromDate: '', toDate: '', reason: '', leaveType: 'Casual' });
      loadData();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Failed to submit leave request.');
    }
  };

  const handleDecision = async (id, status) => {
    await api.patch(`/leaves/${id}/status`, { status });
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Leave</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Apply for leave and track approval status. Sick: 7 days, Casual: 5 days, Optional: 3 days (15 days total per year).
        </p>
      </div>

      {/* Leave balance */}
      {balance && (
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Leave balance ({balance.year})</h3>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex flex-wrap gap-4">
              <span className="text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-100">Total:</strong> {balance.total} days
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-100">Used:</strong> {balance.used} days
              </span>
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                <strong>Remaining:</strong> {balance.remaining} days
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-200 dark:border-slate-600">
              {balance.byType && ['Sick', 'Casual', 'Optional'].map(t => (
                <span key={t} className="text-slate-600 dark:text-slate-400">
                  <strong>{t}:</strong> {balance.byType[t]?.used ?? 0} / {balance.byType[t]?.limit ?? 0} days
                  {balance.byType[t]?.remaining != null && (
                    <span className="text-slate-500 dark:text-slate-500"> ({balance.byType[t].remaining} left)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Apply Leave</h3>
          <form className="mt-4 space-y-3 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block text-slate-600 dark:text-slate-300">Leave type</label>
              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Sick">Sick (7 days/year)</option>
                <option value="Casual">Casual (5 days/year)</option>
                <option value="Optional">Optional (3 days/year)</option>
              </select>
            </div>
            {submitError && (
              <p className="text-red-600 dark:text-red-400 text-xs">{submitError}</p>
            )}
            <div>
              <label className="block text-slate-600 dark:text-slate-300">From Date</label>
              <input
                type="date"
                name="fromDate"
                value={form.fromDate}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300">To Date</label>
              <input
                type="date"
                name="toDate"
                value={form.toDate}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300">Reason</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Describe the reason for leave..."
              />
            </div>
            <button
              type="submit"
              className="mt-1 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-xs font-medium text-white"
            >
              Submit Request
            </button>
          </form>
        </div>

        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            My Leave Requests
          </h3>
          <div className="mt-2 space-y-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 dark:text-slate-400">Type:</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  {LEAVE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 dark:text-slate-400">Status:</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-slate-500 dark:text-slate-400">From:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 py-0.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-slate-500 dark:text-slate-400">To:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 py-0.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {(filterType || filterStatus || filterStartDate || filterEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('');
                    setFilterStatus('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 max-h-64 overflow-auto text-xs space-y-2">
            {leaves.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500">No leave requests yet.</p>
            )}
            {leaves.map(l => (
              <div
                key={l._id}
                className="border border-slate-100 dark:border-slate-600 rounded-lg p-2 flex items-start justify-between"
              >
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-[10px] mr-1.5">{l.leaveType || 'Casual'}</span>
                    {l.reason}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(l.fromDate).toLocaleDateString()} -{' '}
                    {new Date(l.toDate).toLocaleDateString()} ({l.days} days)
                  </p>
                  {l.managerComment && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Manager: {l.managerComment}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    l.status === 'Approved'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      : l.status === 'Rejected'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(user.role === 'manager' || user.role === 'admin') && (
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Pending Approvals
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-slate-600 dark:text-slate-400">Filter by type:</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              {LEAVE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 max-h-72 overflow-auto text-xs space-y-2">
            {pendingLeaves.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500">No pending requests.</p>
            )}
            {pendingLeaves.map(l => (
              <div
                key={l._id}
                className="border border-slate-100 dark:border-slate-600 rounded-lg p-2 flex items-start justify-between"
              >
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {l.employee?.name} – <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-[10px]">{l.leaveType || 'Casual'}</span> {l.reason}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(l.fromDate).toLocaleDateString()} -{' '}
                    {new Date(l.toDate).toLocaleDateString()} ({l.days} days)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(l._id, 'Approved')}
                    className="px-2 py-0.5 rounded bg-green-500 text-white text-[11px]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(l._id, 'Rejected')}
                    className="px-2 py-0.5 rounded bg-red-500 text-white text-[11px]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;

