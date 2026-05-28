import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const Documents = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Policy',
    visibility: {
      employee: true,
      manager: true,
      admin: true
    }
  });
  const [file, setFile] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleVisibilityChange = (role) => (e) => {
    setForm(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [role]: e.target.checked
      }
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const roles = Object.keys(form.visibility).filter(role => form.visibility[role]);
      if (roles.length === 0) {
        setError('Please select at least one role for visibility.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('file', file);
      formData.append('roleVisibility', JSON.stringify(roles));

      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setForm({
        title: '',
        category: 'Policy',
        visibility: { employee: true, manager: true, admin: true }
      });
      setFile(null);
      // Clear file input manually
      document.getElementById('file-upload-input').value = '';
      setSuccess('Document uploaded successfully.');
      fetchDocuments();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${id}`);
        fetchDocuments();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  const filteredList = list.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                          doc.fileName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? doc.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const isAdmin = user?.role === 'admin';
  const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Documents &amp; Policies
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Access employee handbooks, guidelines, templates, and company policies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Documents list & filters */}
        <div className="md:col-span-2 hr-card p-4 space-y-4 flex flex-col h-[500px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Shared Folder
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="Policy">Policy</option>
                <option value="Handbook">Handbook</option>
                <option value="Template">Template</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500 py-8 text-center animate-pulse">Loading documents...</p>
          ) : filteredList.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-center py-8">No documents available.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {filteredList.map(doc => (
                <div
                  key={doc._id}
                  className="p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/10"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{doc.title}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{doc.category}</span>
                      <span>•</span>
                      <span>{doc.fileName}</span>
                      <span>•</span>
                      <span>Uploaded by {doc.uploadedBy?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`${apiBaseUrl}${doc.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-sm flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Admin uploader */}
        {isAdmin ? (
          <div className="hr-card p-4 h-[500px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Upload Document
            </h3>
            <form onSubmit={handleUpload} className="space-y-4 mt-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Document Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Employee Handbook 2026"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Policy">Policy</option>
                    <option value="Handbook">Handbook</option>
                    <option value="Template">Template</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Select File</label>
                  <input
                    type="file"
                    id="file-upload-input"
                    onChange={handleFileChange}
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">PDFs, Word documents, text files, and images are supported.</p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1.5">Visibility Permissions</label>
                  <div className="space-y-2 pl-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={form.visibility.employee}
                        onChange={handleVisibilityChange('employee')}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      Employees
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={form.visibility.manager}
                        onChange={handleVisibilityChange('manager')}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      Managers
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={form.visibility.admin}
                        onChange={handleVisibilityChange('admin')}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      Admins
                    </label>
                  </div>
                </div>

                {error && <p className="text-red-500 font-semibold">{error}</p>}
                {success && <p className="text-green-500 font-semibold">{success}</p>}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors disabled:opacity-50 shadow-lg"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        ) : (
          <div className="hr-card p-4 h-[500px] flex items-center justify-center text-center">
            <p className="text-slate-400 dark:text-slate-500">Only Admin users can upload new files.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
