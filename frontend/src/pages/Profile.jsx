import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { logout } = useAuth();
  const [form, setForm] = useState({
    name: '',
    dob: '',
    age: '',
    email: ''
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
          dob: u.dob ? u.dob.substring(0, 10) : ''
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
    await api.put('/users/me', form);
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Update your personal details and contact information.
      </p>

      <form className="mt-4 hr-card p-4 space-y-3 text-xs" onSubmit={handleSave}>
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

