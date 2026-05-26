import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const Login = () => {
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
        await login(form.email, form.password, form.role);
        navigate('/');
      } else if (mode === 'signup') {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
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
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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
        </div>
      </div>
    </div>
  );
};

export default Login;
