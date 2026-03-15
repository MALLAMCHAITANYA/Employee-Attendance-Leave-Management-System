import React, { useEffect, useMemo, useState } from 'react';
import Clock from '../components/common/Clock';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { getUpcomingHolidays } from '../data/holidays';

const Dashboard = () => {
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const upcomingHolidays = useMemo(() => getUpcomingHolidays(3), []);
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [teamFeedback, setTeamFeedback] = useState([]);
  const { user } = useAuth();

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const text = feedbackText.trim();
    if (!text) {
      setFeedbackMessage({ type: 'error', text: 'Please enter your feedback.' });
      return;
    }
    setFeedbackLoading(true);
    setFeedbackMessage(null);
    try {
      await api.post('/feedback', { text });
      setFeedbackMessage({ type: 'success', text: 'Thank you for your feedback.' });
      setFeedbackText('');
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to submit. Please try again.'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [attRes, myLeaves] = await Promise.all([
        api.get('/attendance/summary'),
        api.get('/leaves/me')
      ]);
      setAttendanceSummary(attRes.data);
      setLeaves(myLeaves.data);

      if (user.role === 'manager' || user.role === 'admin') {
        const [pendingRes, feedbackRes] = await Promise.all([
          api.get('/leaves/pending'),
          api.get('/feedback/all')
        ]);
        setPendingLeaves(pendingRes.data);
        setTeamFeedback(feedbackRes.data);
      }
    };
    fetchData().catch(console.error);
  }, [user.role]);

  const lastTwoLeaves = leaves.slice(0, 2);

  return (
    <div className="p-6 space-y-6">
      <div className="hr-card p-6">
        <Clock />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Attendance Summary
          </h3>
          {attendanceSummary ? (
            <div className="mt-3 text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <p>
                <span className="font-medium">Total Days:</span>{' '}
                {attendanceSummary.totalDays}
              </p>
              <p className="text-green-600 dark:text-green-400">
                <span className="font-medium">Present:</span>{' '}
                {attendanceSummary.totalPresent}
              </p>
              <p className="text-red-600 dark:text-red-400">
                <span className="font-medium">Absent:</span>{' '}
                {attendanceSummary.totalAbsent}
              </p>
              <p>
                <span className="font-medium">Today:</span>{' '}
                {attendanceSummary.todayStatus}
              </p>
              <p>
                <span className="font-medium">Hours Today:</span>{' '}
                {attendanceSummary.hoursToday}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Loading summary...</p>
          )}
        </div>

        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Upcoming Holidays
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {upcomingHolidays.length === 0 && (
              <li className="text-slate-400 dark:text-slate-500">No upcoming holidays this year.</li>
            )}
            {upcomingHolidays.map(h => (
              <li key={h.dateStr} className="leading-snug">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {String(h.date.getDate()).padStart(2, '0')}
                </span>
                {' '}
                <span className="text-slate-500 dark:text-slate-400">{h.dayName}</span>
                {' '}
                {h.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Leave Summary</h3>
          <div className="mt-3 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <p>
              <span className="font-medium">Total Requests:</span>{' '}
              {leaves.length}
            </p>
            <p>
              <span className="font-medium">Approved:</span>{' '}
              {leaves.filter(l => l.status === 'Approved').length}
            </p>
            <p>
              <span className="font-medium">Pending:</span>{' '}
              {leaves.filter(l => l.status === 'Pending').length}
            </p>
            <p>
              <span className="font-medium">Rejected:</span>{' '}
              {leaves.filter(l => l.status === 'Rejected').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Leaves</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {lastTwoLeaves.length === 0 && (
              <li className="text-slate-400 dark:text-slate-500">No leave history yet.</li>
            )}
            {lastTwoLeaves.map(l => (
              <li
                key={l._id}
                className="flex items-center justify-between text-slate-600 dark:text-slate-300"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{l.reason}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(l.fromDate).toLocaleDateString()} -{' '}
                    {new Date(l.toDate).toLocaleDateString()} ({l.days} days)
                  </p>
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
              </li>
            ))}
          </ul>
        </div>

        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Review & Feedback
          </h3>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Share quick feedback about your day, your team, or Work Space.
            Regular reflections help us continuously improve the workplace.
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Managers and admins can view submitted feedback.
          </p>
          <form onSubmit={handleSubmitReview} className="mt-3">
            <textarea
              rows={4}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg text-xs px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Write a short review or highlight today's achievements..."
              disabled={feedbackLoading}
            />
            {feedbackMessage && (
              <p
                className={`mt-2 text-xs ${
                  feedbackMessage.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {feedbackMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={feedbackLoading}
              className="mt-3 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-xs font-medium text-white disabled:opacity-50"
            >
              {feedbackLoading ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {(user.role === 'manager' || user.role === 'admin') && teamFeedback.length > 0 && (
        <div className="hr-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Team Feedback
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Feedback submitted by employees (visible to managers and admins only).
          </p>
          <ul className="mt-3 space-y-2 text-xs max-h-48 overflow-auto">
            {teamFeedback.slice(0, 10).map(f => (
              <li
                key={f._id}
                className="border border-slate-100 dark:border-slate-600 rounded-lg p-2 text-slate-700 dark:text-slate-300"
              >
                <p className="font-medium text-slate-600 dark:text-slate-200">
                  {f.user?.name} ({f.user?.role})
                </p>
                <p className="mt-0.5 text-slate-800 dark:text-slate-200">{f.text}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {new Date(f.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
