import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const Login = () => {
  const { login, signup, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'General',
    branch: 'HQ'
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA States
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  useEffect(() => {
    if (token) {
      setMode('reset');
    }
  }, [token]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password, form.role);
        if (res && res.require2FA) {
          setRequire2FA(true);
          setTempToken(res.tempToken);
          setError(null);
        } else {
          navigate('/');
        }
      } else if (mode === 'signup') {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department,
          branch: form.branch
        };
        await signup(payload);
        navigate('/');
      } else if (mode === 'forgot') {
        const res = await api.post('/auth/forgot-password', { email: form.email });
        setSuccessMessage(res.data.message);
      } else if (mode === 'reset') {
        const res = await api.post('/auth/reset-password', { token, password: form.password });
        setSuccessMessage(res.data.message + ' Please log in below.');
        setMode('login');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
    }
  };

  const handle2FASubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/auth/2fa/login', {
        tempToken,
        token: twoFactorCode
      });
      const { token: jwtToken, user: u } = res.data;
      localStorage.setItem('emp_token', jwtToken);
      localStorage.setItem('emp_user', JSON.stringify(u));
      updateUser(u);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid verification code');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'forgot': return 'Reset your password';
      case 'reset': return 'Enter new password';
      default: return 'Login to your account';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Left panel */}
        <div className="bg-slate-900 text-slate-50 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold">
                W
              </div>
              <div className="text-lg font-semibold">Work Space</div>
            </div>
            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Manage employee attendance, leave requests, and profiles in a
              single, intuitive dashboard. Built for HR teams and managers who
              value precision and clarity.
            </p>
          </div>
          <div className="mt-10 text-xs text-slate-500">
            © {new Date().getFullYear()} Work Space. All rights reserved.
          </div>
        </div>

        {/* Right panel */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          {require2FA ? (
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 text-center">
                Two-Factor Security
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
                Open your authenticator app and enter the 6-digit verification code.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handle2FASubmit}>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center tracking-[0.5em] font-bold"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Verify &amp; Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequire2FA(false);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:underline text-center mt-2"
                >
                  Back to Login
                </button>
              </form>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {getTitle()}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'forgot' ? 'Enter your email to receive a password reset link.' : 'Enter your details to continue.'}
              </p>

              {/* Toggle buttons - only show for login / signup */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="mt-4 flex text-xs border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className={`flex-1 py-2 ${
                      mode === 'login'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                    onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 ${
                      mode === 'signup'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                    onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
                  >
                    Signup
                  </button>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Department
                        </label>
                        <select
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="General">General</option>
                          <option value="Engineering">Engineering</option>
                          <option value="HR">HR</option>
                          <option value="Sales">Sales</option>
                          <option value="Marketing">Marketing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Branch
                        </label>
                        <select
                          name="branch"
                          value={form.branch}
                          onChange={handleChange}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="HQ">HQ</option>
                          <option value="Branch A">Branch A</option>
                          <option value="Branch B">Branch B</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {mode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Role
                    </label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setSuccessMessage(null); }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-3 py-2 rounded-lg">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Login'
                    : mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Reset Password'}
                </button>

                {mode === 'login' ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      className="text-primary-600 dark:text-primary-400 font-medium"
                      onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
                    >
                      Signup
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="text-primary-600 dark:text-primary-400 font-medium"
                      onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                    >
                      Login
                    </button>
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
