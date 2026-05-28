import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Payslips = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adminSelectedEmp, setAdminSelectedEmp] = useState('');
  
  // Form for generating payslip
  const [form, setForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: '',
    allowances: '',
    deductions: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchMyPayslips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payslips/my');
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeePayslips = async (empId) => {
    setLoading(true);
    try {
      const res = await api.get(`/payslips/employee/${empId}`);
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      setEmployees(res.data);
      if (res.data.length > 0) {
        setForm(f => ({ ...f, employeeId: res.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
    }
    fetchMyPayslips();
  }, [user]);

  const handleAdminEmpChange = (e) => {
    const val = e.target.value;
    setAdminSelectedEmp(val);
    if (val === '') {
      fetchMyPayslips();
    } else {
      fetchEmployeePayslips(val);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post('/payslips', {
        employeeId: form.employeeId,
        month: Number(form.month),
        year: Number(form.year),
        basicSalary: Number(form.basicSalary),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0)
      });
      setSuccess('Payslip generated successfully!');
      setForm(f => ({ ...f, basicSalary: '', allowances: '', deductions: '' }));
      if (adminSelectedEmp === form.employeeId) {
        fetchEmployeePayslips(form.employeeId);
      } else if (adminSelectedEmp === '') {
        fetchMyPayslips();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate payslip');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payslip run?')) {
      try {
        await api.delete(`/payslips/${id}`);
        if (adminSelectedEmp) {
          fetchEmployeePayslips(adminSelectedEmp);
        } else {
          fetchMyPayslips();
        }
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payslips
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Verify and print your official salary payslip statements.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Payslip history list */}
        <div className="md:col-span-2 hr-card p-4 space-y-4 flex flex-col h-[500px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Salary History
            </h3>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium">Select Employee:</label>
                <select
                  value={adminSelectedEmp}
                  onChange={handleAdminEmpChange}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-700"
                >
                  <option value="">My Own Payslips</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-slate-500 py-8 text-center animate-pulse">Loading payslips...</p>
          ) : payslips.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-center py-8">No payslip runs found for this period.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {payslips.map(p => (
                <div
                  key={p._id}
                  onClick={() => setSelectedPayslip(p)}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                    selectedPayslip?._id === p._id
                      ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-600/10'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/10'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {MONTHS_LIST[p.month - 1]} {p.year}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Basic: ${p.basicSalary} | Net: ${p.netSalary} | Status: <span className="font-semibold text-green-500">{p.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-[10px]"
                    >
                      View
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Payslip"
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

        {/* Right Column: Admin payslip creator */}
        {isAdmin ? (
          <div className="hr-card p-4 h-[500px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Generate Payslip
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 mt-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Select Employee</label>
                  <select
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Month</label>
                    <select
                      name="month"
                      value={form.month}
                      onChange={handleChange}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {MONTHS_LIST.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Year</label>
                    <input
                      type="number"
                      name="year"
                      required
                      value={form.year}
                      onChange={handleChange}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">Basic Salary ($)</label>
                  <input
                    type="number"
                    name="basicSalary"
                    required
                    value={form.basicSalary}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Allowances ($)</label>
                    <input
                      type="number"
                      name="allowances"
                      value={form.allowances}
                      onChange={handleChange}
                      placeholder="e.g. 200"
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium">Deductions ($)</label>
                    <input
                      type="number"
                      name="deductions"
                      value={form.deductions}
                      onChange={handleChange}
                      placeholder="e.g. 150"
                      className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 font-semibold">{error}</p>}
                {success && <p className="text-green-500 font-semibold">{success}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-lg"
              >
                Generate &amp; Pay
              </button>
            </form>
          </div>
        ) : (
          <div className="hr-card p-4 h-[500px] flex items-center justify-center text-center">
            <p className="text-slate-400 dark:text-slate-500">Only HR Admins can generate employee payslips.</p>
          </div>
        )}
      </div>

      {/* Payslip Viewer Receipt Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-slate-800">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 flex flex-col relative print:p-0 print:border-0 print:shadow-none print:fixed print:inset-0">
            
            {/* Payslip Card Content */}
            <div id="print-area" className="flex-1 space-y-6">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Work Space Portal</h3>
                <p className="text-[10px] text-slate-500 mt-1">Official Salary Pay Advice</p>
                <p className="text-xs font-semibold text-slate-800 mt-1.5">
                  Statement for {MONTHS_LIST[selectedPayslip.month - 1]} {selectedPayslip.year}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 text-[11px] border-b border-dashed border-slate-300 pb-4">
                <div>
                  <span className="text-slate-400 block font-medium">Employee ID</span>
                  <span className="font-semibold text-slate-900">{user.id.substring(0, 10)}...</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="font-semibold text-slate-900 capitalize">{user.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Designation</span>
                  <span className="font-semibold text-slate-900 capitalize">{user.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Payment Status</span>
                  <span className="font-bold text-green-600 uppercase">{selectedPayslip.status}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[10px]">Salary Breakup</h4>
                <div className="flex justify-between items-center py-1">
                  <span>Basic salary</span>
                  <span className="font-semibold">${selectedPayslip.basicSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Allowances</span>
                  <span className="font-semibold text-green-600">+${selectedPayslip.allowances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Deductions</span>
                  <span className="font-semibold text-red-600">-${selectedPayslip.deductions.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-bold text-slate-900">
                <span>NET SALARY PAID</span>
                <span className="text-primary-600">${selectedPayslip.netSalary.toFixed(2)}</span>
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 w-full mt-6 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Close Statement
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors shadow-lg"
              >
                Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
