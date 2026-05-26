import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Garfield',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie'
];

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: '',
    dob: '',
    age: '',
    email: '',
    annualLeaveDays: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/users/me')
      .then(res => {
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          age: u.age || '',
          dob: u.dob ? u.dob.substring(0, 10) : '',
          annualLeaveDays: u.annualLeaveDays ?? '',
          avatar: u.avatar || ''
        });
      })
      .catch(console.error);
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Update your personal details and contact information.
      </p>

      <form className="mt-4 hr-card p-4 space-y-3 text-xs" onSubmit={handleSave}>
        {/* Avatar Selection */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 mb-2 font-medium">Choose Avatar</label>
          <div className="flex flex-wrap gap-2.5 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
            {PRESET_AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setForm(f => ({ ...f, avatar: av }))}
                className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0 ${
                  form.avatar === av
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <img src={av} alt={`avatar-${idx}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Or Custom Avatar URL</label>
            <input
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.png"
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-300">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300">Annual Leave Quota (days/year)</label>
          {user?.role === 'manager' || user?.role === 'admin' ? (
            <input
              type="number"
              name="annualLeaveDays"
              value={form.annualLeaveDays}
              onChange={handleChange}
              placeholder="Default: 15"
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <input
              type="text"
              disabled
              value={form.annualLeaveDays ? `${form.annualLeaveDays} days` : '15 days (Default)'}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-600">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-xs font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

