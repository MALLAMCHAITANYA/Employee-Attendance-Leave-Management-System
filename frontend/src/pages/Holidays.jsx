import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Holidays = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'Public', description: '' });
  const [error, setError] = useState(null);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/holidays?year=${currentYear}`);
      const parsed = res.data.map(h => {
        const date = new Date(h.date);
        return {
          ...h,
          date,
          dayName: WEEKDAY_NAMES[date.getUTCDay()]
        };
      });
      setHolidays(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [currentYear]);

  const byMonthIndex = useMemo(() => {
    const map = {};
    holidays.forEach(h => {
      const idx = h.date.getUTCMonth();
      if (!map[idx]) map[idx] = [];
      map[idx].push(h);
    });
    return map;
  }, [holidays]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/holidays', form);
      setForm({ name: '', date: '', type: 'Public', description: '' });
      setShowModal(false);
      fetchHolidays();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create holiday');
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await api.delete(`/holidays/${id}`);
        fetchHolidays();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete holiday');
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Holiday Calendar
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Company holidays for {currentYear}.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => { setError(null); setShowModal(true); }}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Holiday
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-8 text-center animate-pulse">Loading holidays...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MONTHS.map((monthName, index) => {
            const list = byMonthIndex[index] || [];

            return (
              <div
                key={monthName}
                className="hr-card overflow-hidden flex flex-col min-h-[140px]"
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    {monthName} {currentYear}
                  </h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  {list.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center flex-1 flex items-center justify-center">
                      No Holidays
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {list.map((h) => {
                        const today = new Date();
                        const holidayDate = h.date;
                        const isToday = today.getUTCDate() === holidayDate.getUTCDate() && 
                                        today.getUTCMonth() === holidayDate.getUTCMonth() && 
                                        today.getUTCFullYear() === holidayDate.getUTCFullYear();
                        return (
                          <li
                            key={h._id}
                            className={`text-slate-700 dark:text-slate-300 leading-snug p-1.5 rounded-md transition-all flex items-center justify-between group ${
                              isToday
                                ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-100 ring-2 ring-primary-500 font-semibold'
                                : ''
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1">
                                {String(holidayDate.getUTCDate()).padStart(2, '0')}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 mr-1">
                                {h.dayName}
                              </span>
                              <span className="truncate inline-block max-w-[120px] align-bottom text-slate-800 dark:text-slate-200" title={h.description || h.name}>
                                {h.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded bg-primary-500 text-white text-[8px] font-bold uppercase tracking-wider">
                                  Today
                                </span>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(h._id)}
                                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                  title="Delete holiday"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Add Company Holiday</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-4">Introduce a new holiday to the calendar.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium">Holiday Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Christmas Day"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Public">Public (National)</option>
                  <option value="Company">Company (Optional/Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief details..."
                  className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {error && (
                <p className="text-red-500 font-medium">{error}</p>
              )}

              <div className="flex gap-3 w-full mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-lg"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
