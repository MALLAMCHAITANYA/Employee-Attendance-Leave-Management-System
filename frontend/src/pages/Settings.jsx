import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const DEFAULT_PREFS = {
  leaveApprovals: true,
  attendanceAlerts: true,
  feedbackReminders: false
};

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const userPrefs = user?.notificationPreferences || DEFAULT_PREFS;

  useEffect(() => {
    setPrefs({
      leaveApprovals: userPrefs.leaveApprovals !== false,
      attendanceAlerts: userPrefs.attendanceAlerts !== false,
      feedbackReminders: !!userPrefs.feedbackReminders
    });
  }, [user]);

  const handlePrefChange = (key) => (e) => {
    setPrefs((p) => ({ ...p, [key]: e.target.checked }));
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/users/me', {
        notificationPreferences: prefs
      });
      updateUser(res.data);
      setMessage({ type: 'success', text: 'Notification preferences saved.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save. Try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Settings
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Personalize your Work Space experience.
      </p>

      <div className="mt-4 hr-card p-4 text-xs space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              Dark Mode
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Switch to a dark theme for the app. Reduces glare in low light.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-xs font-medium transition-colors ${!isDark ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
              Light
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                isDark ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-all duration-200 ease-out ${
                  isDark ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-xs font-medium transition-colors ${isDark ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
              Dark
            </span>
          </div>
        </div>

        {/* Email Notifications */}
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Email Notifications
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
            Choose when you want to receive email notifications (e.g. leave
            approvals, attendance alerts).
          </p>
          <div className="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-200">How it works:</strong> When you apply for leave and a manager approves or rejects it, your preference here is used. If &quot;Leave approvals&quot; is <strong>on</strong>, you would receive an email notifying you of the decision (e.g. &quot;Your leave request has been approved&quot;). If it is <strong>off</strong>, you will not get that email. You can always check the status under Leave → My Leave Requests. Your choices are saved and will apply when email notifications are sent.
            </p>
          </div>
          <form onSubmit={handleSaveNotifications} className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.leaveApprovals}
                onChange={handlePrefChange('leaveApprovals')}
                className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Leave approvals – when your leave request is approved or rejected
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.attendanceAlerts}
                onChange={handlePrefChange('attendanceAlerts')}
                className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Attendance alerts – anomalies or reminders (e.g. missing sign
                out)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.feedbackReminders}
                onChange={handlePrefChange('feedbackReminders')}
                className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Feedback reminders – optional weekly reminder to submit feedback
              </span>
            </label>
            {message && (
              <p
                className={`text-xs ${
                  message.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notification preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
