import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_CODE = { Present: 'P', Absent: 'A', Pending: 'Pen' };

/** Build calendar grid for a month: array of weeks, each week is array of { date, dayNum, isCurrentMonth, isToday } */
function getCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const days = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, 1 - (startPad - i));
    days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false, isToday: false });
  }
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      dayNum: d,
      isCurrentMonth: true,
      isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    });
  }
  const endPad = 42 - days.length;
  for (let i = 0; i < endPad; i++) {
    const d = new Date(year, month + 1, i + 1);
    days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false, isToday: false });
  }
  return days;
}

function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const Attendance = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthData, setMonthData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [minWorkHours, setMinWorkHours] = useState(8);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const monthName = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
    [viewYear, viewMonth]
  );

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const dateMap = useMemo(() => {
    const map = {};
    (monthData || []).forEach((r) => {
      const key = dateKey(r.date);
      map[key] = r;
    });
    return map;
  }, [monthData]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/attendance/summary');
      setSummary(res.data);
      setMinWorkHours(res.data?.minWorkHours ?? 8);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load summary');
    }
  };

  const fetchMonthAttendance = async () => {
    setCalendarLoading(true);
    try {
      const res = await api.get(`/attendance/me?year=${viewYear}&month=${viewMonth + 1}`);
      setMonthData(res.data.list || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance');
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSummary().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMonthAttendance();
  }, [viewYear, viewMonth]);

  const isViewingCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  useEffect(() => {
    if (isViewingCurrentMonth && !calendarLoading && selectedDate === null) {
      setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    }
  }, [isViewingCurrentMonth, calendarLoading]);

  const handleSignIn = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post('/attendance/signin');
      await fetchSummary();
      await fetchMonthAttendance();
    } catch (err) {
      setError(err?.response?.data?.message || 'Sign in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post('/attendance/signout');
      await fetchSummary();
      await fetchMonthAttendance();
    } catch (err) {
      setError(err?.response?.data?.message || 'Sign out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setError(null);
      const res = await api.get('/attendance/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_history_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to export attendance CSV');
    }
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const isClockedIn = summary?.isClockedIn ?? false;
  const todayLoginTime = summary?.todayLoginTime ? new Date(summary.todayLoginTime) : null;
  const selectedRecord = selectedDate ? dateMap[dateKey(selectedDate)] : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attendance</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use Attendance Sign In when you start work and Sign Out when you leave. Minimum {minWorkHours} hrs/day = Present.
            Click a date on the calendar to see details.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Today's session */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Today&apos;s attendance session</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : isClockedIn ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Signed in at{' '}
              {todayLoginTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? '…' : 'Attendance Sign Out'}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {actionLoading ? '…' : 'Attendance Sign In'}
            </button>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Click to start your attendance for today.
            </p>
          </div>
        )}
      </div>

      {/* Calendar + Detail panel */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 hr-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {monthName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevMonth}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ‹ Prev
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Next ›
              </button>
            </div>
          </div>

          {calendarLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">Loading calendar…</p>
          ) : (
            <>
              {/* Weekday header row with border */}
              <div className="grid grid-cols-7 border border-slate-200 dark:border-slate-600 rounded-t-lg overflow-hidden">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-b border-r border-slate-200 dark:border-slate-600 last:border-r-0"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid with visible borders */}
              <div className="grid grid-cols-7 border border-t-0 border-slate-200 dark:border-slate-600 rounded-b-lg overflow-hidden">
                {calendarDays.map((cell, idx) => {
                  const key = dateKey(cell.date);
                  const record = cell.isCurrentMonth ? dateMap[key] : null;
                  const status = record?.status;
                  const code = status ? STATUS_CODE[status] || status : (cell.isCurrentMonth ? 'O' : '');
                  const isSelected = selectedDate && dateKey(selectedDate) === key;
                  const isToday = cell.isToday;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => cell.isCurrentMonth && setSelectedDate(cell.date)}
                      disabled={!cell.isCurrentMonth}
                      className={`
                        min-h-[48px] text-xs font-medium flex flex-col items-center justify-center
                        border-r border-b border-slate-200 dark:border-slate-600
                        [&:nth-child(7n)]:border-r-0
                        transition-colors
                        ${!cell.isCurrentMonth
                          ? 'text-slate-300 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 cursor-default'
                          : 'text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/70'}
                        ${isToday
                          ? '!bg-primary-100 dark:!bg-primary-500/25 ring-inset ring-2 ring-primary-500 dark:ring-primary-400 !text-primary-900 dark:!text-primary-100'
                          : ''}
                        ${isSelected && !isToday
                          ? '!bg-primary-50 dark:!bg-primary-900/30 ring-inset ring-2 ring-primary-500 dark:ring-primary-400'
                          : ''}
                      `}
                    >
                      <span className={!cell.isCurrentMonth ? 'opacity-60' : ''}>{cell.dayNum}</span>
                      {cell.isCurrentMonth && (
                        <span
                          className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            status === 'Present'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                              : status === 'Absent'
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                              : status === 'Pending'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-600/50 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {code || 'O'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend: neat row of badges + hint */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium">
                    <span className="w-4 h-4 rounded bg-green-500 dark:bg-green-400 text-white flex items-center justify-center text-[10px] font-bold">P</span>
                    Present
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 text-xs font-medium">
                    <span className="w-4 h-4 rounded bg-red-500 dark:bg-red-400 text-white flex items-center justify-center text-[10px] font-bold">A</span>
                    Absent
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-medium">
                    <span className="w-4 h-4 rounded bg-amber-500 dark:bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold">Pen</span>
                    Pending
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300 text-xs font-medium">
                    <span className="w-4 h-4 rounded bg-slate-400 dark:bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold">O</span>
                    Off
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Click a date on the calendar to view First In, Last Out and total hours.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Attendance details
          </h3>
          {selectedDate ? (
            selectedRecord ? (
              <div className="text-xs space-y-3">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-600 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">First In</span>
                    <span className="text-slate-800 dark:text-slate-100 font-medium">
                      {selectedRecord.firstSignIn
                        ? new Date(selectedRecord.firstSignIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Last Out</span>
                    <span className="text-slate-800 dark:text-slate-100 font-medium">
                      {selectedRecord.lastSignOut
                        ? new Date(selectedRecord.lastSignOut).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total work hrs</span>
                    <span className="text-slate-800 dark:text-slate-100 font-medium">
                      {selectedRecord.totalHours != null
                        ? `${selectedRecord.totalHours.toFixed(2)} hrs`
                        : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        selectedRecord.status === 'Present'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : selectedRecord.status === 'Absent'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                  Minimum {minWorkHours} hrs required for Present.
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 py-4">
                <p className="font-medium text-slate-600 dark:text-slate-300">No attendance record</p>
                <p className="mt-1">This day has no sign-in. Shown as Off (O) on the calendar.</p>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Click a date on the calendar to view First In, Last Out, and total hours for that day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
