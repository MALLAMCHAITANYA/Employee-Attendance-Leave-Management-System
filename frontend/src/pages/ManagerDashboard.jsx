import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [teamFeedback, setTeamFeedback] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentText, setCommentText] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, feedbackRes, attendanceRes] = await Promise.all([
        api.get('/leaves/pending'),
        api.get('/feedback/all'),
        api.get('/attendance/team?date=' + new Date().toISOString())
      ]);
      setPendingLeaves(pendingRes.data);
      setTeamFeedback(feedbackRes.data);
      setTodayAttendance(attendanceRes.data);
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (id, status) => {
    setActionLoading(true);
    try {
      const managerComment = commentText[id] || '';
      await api.patch(`/leaves/${id}/status`, { status, managerComment });
      // Clear comment for this ID
      setCommentText(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update leave status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentChange = (id, text) => {
    setCommentText(prev => ({ ...prev, [id]: text }));
  };

  // Compute attendance stats
  const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
  const absentCount = todayAttendance.filter(a => a.status === 'Absent').length;
  const pendingCount = todayAttendance.filter(a => a.status === 'Pending').length;
  const totalCount = todayAttendance.length;

  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : 0;

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Manager Hub
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Department: <span className="font-semibold text-primary-500 capitalize">{user?.department}</span> | Branch: <span className="font-semibold text-primary-500 capitalize">{user?.branch}</span>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center animate-pulse">Loading dashboard info...</p>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="hr-card p-4 flex flex-col justify-between">
              <span className="font-medium text-slate-500">Pending Leaves</span>
              <span className="text-2xl font-bold text-amber-500 mt-2">{pendingLeaves.length}</span>
            </div>
            <div className="hr-card p-4 flex flex-col justify-between">
              <span className="font-medium text-slate-500">Team Size</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalCount}</span>
            </div>
            <div className="hr-card p-4 flex flex-col justify-between">
              <span className="font-medium text-slate-500">Present Today</span>
              <span className="text-2xl font-bold text-green-500 mt-2">{presentCount}</span>
            </div>
            <div className="hr-card p-4 flex flex-col justify-between">
              <span className="font-medium text-slate-500">Daily Attendance Rate</span>
              <span className="text-2xl font-bold text-primary-500 mt-2">{attendanceRate}%</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Pending Approvals */}
            <div className="md:col-span-2 hr-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
                Pending Leave Requests
              </h3>
              {pendingLeaves.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-center py-6">No pending leaves to approve.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {pendingLeaves.map(l => (
                    <div
                      key={l._id}
                      className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50/30 dark:bg-slate-800/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {l.employee?.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {l.employee?.email} | Role: <span className="capitalize">{l.employee?.role}</span>
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                          {l.leaveType}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-[11px] bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div>
                          <span className="text-slate-400 block">Period</span>
                          <span className="font-medium">{new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Duration</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{l.days} days</span>
                        </div>
                      </div>

                      <div className="text-[11px]">
                        <span className="text-slate-400 block">Reason</span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-300 italic leading-relaxed">&ldquo;{l.reason}&rdquo;</p>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2.5">
                        <label className="text-[10px] text-slate-400 font-semibold block">Add Manager Comment (Optional)</label>
                        <input
                          type="text"
                          value={commentText[l._id] || ''}
                          onChange={(e) => handleCommentChange(l._id, e.target.value)}
                          placeholder="Provide a reason for approval/rejection..."
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDecision(l._id, 'Rejected')}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(l._id, 'Approved')}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold shadow-sm shadow-green-600/10"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Presence & Feedback */}
            <div className="space-y-6">
              {/* Daily Overview */}
              <div className="hr-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
                  Today's Attendance
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {todayAttendance.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-center py-4">No team members assigned.</p>
                  ) : (
                    todayAttendance.map(a => (
                      <div key={a.user?._id} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-b-0">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{a.user?.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.status === 'Present'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : a.status === 'Absent'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Latest Team Feedback */}
              <div className="hr-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
                  Latest Team Feedback
                </h3>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {teamFeedback.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-center py-4">No feedback submitted.</p>
                  ) : (
                    teamFeedback.map(f => (
                      <div
                        key={f._id}
                        className="p-2 border border-slate-100 dark:border-slate-700 rounded-lg space-y-1.5"
                      >
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{f.user?.name}</span>
                          <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic">&ldquo;{f.text}&rdquo;</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
