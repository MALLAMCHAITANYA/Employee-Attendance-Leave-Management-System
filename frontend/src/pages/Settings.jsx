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

  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(null);

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

        {/* Two-Factor Authentication Management */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Two-Factor Authentication (2FA)
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Secure your account with an additional 6-digit verification code from Google Authenticator or another TOTP app.
          </p>

          {twoFactorSuccess && (
            <p className="mb-3 text-xs text-green-600 dark:text-green-400 font-medium">
              {twoFactorSuccess}
            </p>
          )}

          {user?.twoFactorEnabled ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div>
                <p className="text-green-800 dark:text-green-300 font-semibold">2FA is currently Enabled</p>
                <p className="text-green-600 dark:text-green-400 mt-0.5">Your account is fully protected by Two-Factor Authentication.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
                    try {
                      const res = await api.post('/auth/2fa/disable');
                      updateUser(res.data.user || { ...user, twoFactorEnabled: false });
                      setTwoFactorSuccess('Two-Factor Authentication has been disabled.');
                    } catch (err) {
                      alert(err?.response?.data?.message || 'Failed to disable 2FA');
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">2FA is currently Disabled</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Protect your account with a second factor.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setTwoFactorError(null);
                  setTwoFactorSuccess(null);
                  try {
                    const res = await api.post('/auth/2fa/setup');
                    setQrCode(res.data.qrCode);
                    setSecretCode(res.data.secret);
                    setShow2FAModal(true);
                  } catch (err) {
                    alert(err?.response?.data?.message || 'Failed to fetch 2FA setup details');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold"
              >
                Setup 2FA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Setup Authenticator</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-4 text-center">Scan the QR code below or type the manual entry key in your TOTP app.</p>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
              <img src={qrCode} alt="2FA QR Code" className="h-40 w-40 object-contain" />
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 mb-4 select-all">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5">Manual Entry Key</p>
              <code className="text-slate-700 dark:text-slate-200 font-mono break-all font-semibold block">{secretCode}</code>
            </div>

            <form
              className="w-full space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setTwoFactorError(null);
                try {
                  await api.post('/auth/2fa/verify', { token: verifyCode });
                  updateUser({ ...user, twoFactorEnabled: true });
                  setTwoFactorSuccess('Two-Factor Authentication verified and enabled successfully.');
                  setShow2FAModal(false);
                  setVerifyCode('');
                } catch (err) {
                  setTwoFactorError(err?.response?.data?.message || 'Invalid 2FA code. Please try again.');
                }
              }}
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Enter Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-center font-bold tracking-widest"
                />
              </div>

              {twoFactorError && (
                <p className="text-red-500 text-[11px] text-center font-medium">{twoFactorError}</p>
              )}

              <div className="flex gap-3 w-full mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShow2FAModal(false);
                    setVerifyCode('');
                    setTwoFactorError(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-lg"
                >
                  Verify Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
