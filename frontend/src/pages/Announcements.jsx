import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const Announcements = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetDepartment: 'All',
    targetBranch: 'All'
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      setList(res.data);
      if (res.data.length > 0) {
        setSelected(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRead = async (ann) => {
    setSelected(ann);
    if (!ann.readBy.includes(user.id)) {
      try {
        await api.post(`/announcements/${ann._id}/read`);
        // Update local list
        setList(prev =>
          prev.map(item =>
            item._id === ann._id
              ? { ...item, readBy: [...item.readBy, user.id] }
              : item
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post('/announcements', form);
      setForm({ title: '', content: '', targetDepartment: 'All', targetBranch: 'All' });
      setSuccess('Announcement published successfully.');
      fetchAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to publish announcement');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const isPublisher = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Announcements
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          View important updates and company-wide notices.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left/Middle Column: Announcements list & details */}
        <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
          {/* List panel */}
          <div className="hr-card p-4 space-y-3 flex flex-col h-[500px]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Bulletin Board
            </h3>
            {loading ? (
              <p className="text-slate-500 py-6 text-center animate-pulse">Loading notices...</p>
            ) : list.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6">No announcements.</p>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {list.map(ann => {
                  const isRead = ann.readBy.includes(user.id);
                  const isSelected = selected?._id === ann._id;
                  return (
                    <div
                      key={ann._id}
                      onClick={() => handleRead(ann)}
                      className={`p-3 border rounded-xl cursor-pointer transition-colors relative ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-600/10'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="flex justify-between items-start pr-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                          {ann.title}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Audience: {ann.targetDepartment} / {ann.targetBranch}
                      </p>
                      
                      {/* Unread dot */}
                      {!isRead && (
                        <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-red-500" />
                      )}

                      {/* Delete option */}
                      {(ann.author?._id === user.id || user.role === 'admin') && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(ann._id, e)}
                          className="absolute bottom-3 right-3 text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details panel */}
          <div className="hr-card p-4 flex flex-col h-[500px]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Notice Details
            </h3>
            {selected ? (
              <div className="space-y-4 flex-1 overflow-y-auto mt-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{selected.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Published by <span className="font-semibold">{selected.author?.name}</span> ({selected.author?.role}) on {new Date(selected.createdAt).toLocaleDateString()} at {new Date(selected.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line">
                  {selected.content}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-center py-12">Select an announcement to read details.</p>
            )}
          </div>
        </div>

        {/* Right Column: Notice Creator (Managers/Admins) */}
        {isPublisher ? (
          <div className="hr-card p-4 flex flex-col h-[500px]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Compose Notice
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 mt-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Server Maintenance Notice"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Content</label>
                  <textarea
                    required
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    placeholder="Provide full description of the notice..."
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Target Department</label>
                    <select
                      value={form.targetDepartment}
                      onChange={(e) => setForm(prev => ({ ...prev, targetDepartment: e.target.value }))}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="All">All Departments</option>
                      <option value="General">General</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Target Branch</label>
                    <select
                      value={form.targetBranch}
                      onChange={(e) => setForm(prev => ({ ...prev, targetBranch: e.target.value }))}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="All">All Branches</option>
                      <option value="HQ">HQ</option>
                      <option value="Branch A">Branch A</option>
                      <option value="Branch B">Branch B</option>
                    </select>
                  </div>
                </div>

                {error && <p className="text-red-500 font-semibold">{error}</p>}
                {success && <p className="text-green-500 font-semibold">{success}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-lg"
              >
                Publish Notice
              </button>
            </form>
          </div>
        ) : (
          <div className="hr-card p-4 h-[500px] flex items-center justify-center text-center">
            <p className="text-slate-400 dark:text-slate-500">Only Managers and Admins can publish notices.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
